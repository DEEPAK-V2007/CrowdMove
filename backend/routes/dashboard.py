from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Bus, BusRoute, BusStop, Alert, Festival
from schemas import DashboardStats, AlertOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    buses = db.query(Bus).all()
    active = [b for b in buses if b.is_active]
    total_pax = sum(b.current_passengers for b in active)
    overcrowded = sum(1 for b in active if b.total_capacity > 0
                      and (b.current_passengers / b.total_capacity) >= 0.9)
    approaching = sum(1 for b in active if b.total_capacity > 0
                      and 0.75 <= (b.current_passengers / b.total_capacity) < 0.9)
    routes = db.query(BusRoute).count()

    return DashboardStats(
        total_buses=len(buses),
        active_buses=len(active),
        total_passengers=total_pax,
        overcrowded_buses=overcrowded,
        approaching_capacity=approaching,
        total_routes=routes,
    )


@router.get("/alerts", response_model=list[AlertOut])
def get_alerts(resolved: bool = False, db: Session = Depends(get_db)):
    alerts = (db.query(Alert)
              .filter(Alert.is_resolved == resolved)
              .order_by(Alert.created_at.desc())
              .limit(50).all())
    return [AlertOut.model_validate(a) for a in alerts]


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).get(alert_id)
    if alert:
        alert.is_resolved = True
        db.commit()
    return {"success": True}


@router.get("/festivals")
def get_festivals(db: Session = Depends(get_db)):
    festivals = db.query(Festival).all()
    return [{"id": f.id, "name": f.name, "date": f.date,
             "demand_multiplier": f.demand_multiplier,
             "affected_routes": f.affected_routes,
             "description": f.description} for f in festivals]


@router.get("/routes")
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(BusRoute).all()
    return [{"id": r.id, "route_number": r.route_number, "name": r.name,
             "source": r.source, "destination": r.destination,
             "total_distance_km": r.total_distance_km,
             "stops": [{"id": s.id, "name": s.name, "stop_order": s.stop_order,
                         "latitude": s.latitude, "longitude": s.longitude}
                        for s in r.stops]}
            for r in routes]


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    recommendations = []
    buses = db.query(Bus).filter(Bus.is_active == True).all()
    route_buses: dict[int, list] = {}
    for b in buses:
        route_buses.setdefault(b.route_id, []).append(b)

    for route_id, rbs in route_buses.items():
        route = db.query(BusRoute).get(route_id)
        if not route:
            continue

        overcrowded = [b for b in rbs if b.total_capacity > 0
                       and (b.current_passengers / b.total_capacity) >= 0.9]
        approaching = [b for b in rbs if b.total_capacity > 0
                       and 0.75 <= (b.current_passengers / b.total_capacity) < 0.9]

        depot_bus = db.query(Bus).filter(
            Bus.route_id == route_id, Bus.is_active == False, Bus.status == "depot"
        ).first()

        if overcrowded:
            total_excess = sum(b.current_passengers - int(b.total_capacity * 0.8) for b in overcrowded)
            recommendations.append({
                "id": f"dispatch-{route_id}",
                "type": "dispatch",
                "priority": "critical",
                "route_number": route.route_number,
                "route_name": route.name,
                "message": f"Deploy additional bus on Route {route.route_number}",
                "detail": f"{len(overcrowded)} bus(es) overcrowded — estimated {total_excess} excess passengers",
                "can_dispatch": depot_bus is not None,
                "depot_bus_id": depot_bus.id if depot_bus else None,
            })

        elif len(approaching) >= 2:
            recommendations.append({
                "id": f"preempt-{route_id}",
                "type": "preemptive",
                "priority": "warning",
                "route_number": route.route_number,
                "route_name": route.name,
                "message": f"Consider standby bus for Route {route.route_number}",
                "detail": f"{len(approaching)} buses approaching capacity — overcrowding likely",
                "can_dispatch": depot_bus is not None,
                "depot_bus_id": depot_bus.id if depot_bus else None,
            })

        sorted_rbs = sorted(rbs, key=lambda b: b.current_stop_index)
        for i in range(len(sorted_rbs) - 1):
            gap = abs(sorted_rbs[i + 1].current_stop_index - sorted_rbs[i].current_stop_index)
            if gap <= 1:
                recommendations.append({
                    "id": f"bunching-{route_id}-{sorted_rbs[i].id}",
                    "type": "hold",
                    "priority": "info",
                    "route_number": route.route_number,
                    "route_name": route.name,
                    "message": f"Regulate headway: Hold {sorted_rbs[i].bus_number} by 3 min to space out arrivals",
                    "detail": f"{sorted_rbs[i].bus_number} and {sorted_rbs[i+1].bus_number} are bunching at adjacent stops",
                    "can_dispatch": False,
                    "depot_bus_id": None,
                    "hold_bus_id": sorted_rbs[i].id,
                    "bus_number": sorted_rbs[i].bus_number,
                })
                break

    recommendations.sort(key=lambda r: {"critical": 0, "warning": 1, "info": 2}.get(r["priority"], 3))
    return recommendations


@router.post("/dispatch/{bus_id}")
def dispatch_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).get(bus_id)
    if not bus:
        return {"success": False, "message": "Bus not found"}
    bus.is_active = True
    bus.status = "active"
    bus.current_passengers = 0
    bus.boarded_count = 0
    bus.alighted_count = 0
    bus.current_stop_index = 0
    route = db.query(BusRoute).get(bus.route_id)
    if route and route.stops:
        first_stop = sorted(route.stops, key=lambda s: s.stop_order)[0]
        bus.latitude = first_stop.latitude
        bus.longitude = first_stop.longitude
    db.commit()
    return {"success": True, "message": f"{bus.bus_number} dispatched to Route {route.route_number if route else ''}", "bus_number": bus.bus_number}


@router.post("/hold/{bus_id}")
def hold_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).get(bus_id)
    if not bus:
        return {"success": False, "message": "Bus not found"}
    # Mark any bunching alert on this route as resolved
    db.query(Alert).filter(
        Alert.route_id == bus.route_id,
        Alert.type == "bunching",
        Alert.is_resolved == False
    ).update({"is_resolved": True})
    db.commit()
    return {
        "success": True,
        "message": f"Headway Regulation Applied: {bus.bus_number} held for 3 minutes to prevent bus bunching.",
        "bus_number": bus.bus_number
    }
