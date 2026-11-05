from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Bus, BusRoute, BusStop
from schemas import BusOut, BusDetailOut, BusRouteOut

router = APIRouter(prefix="/api/buses", tags=["buses"])


def compute_crowd_status(current: int, capacity: int) -> tuple[str, float]:
    if capacity == 0:
        return "green", 0
    pct = (current / capacity) * 100
    if pct < 50:
        status = "green"
    elif pct < 75:
        status = "yellow"
    elif pct < 90:
        status = "orange"
    else:
        status = "red"
    return status, round(pct, 1)


def bus_to_out(bus: Bus) -> BusOut:
    status, pct = compute_crowd_status(bus.current_passengers, bus.total_capacity)
    return BusOut(
        id=bus.id, bus_number=bus.bus_number, route_id=bus.route_id,
        total_capacity=bus.total_capacity, seated_capacity=bus.seated_capacity,
        current_passengers=bus.current_passengers, boarded_count=bus.boarded_count,
        alighted_count=bus.alighted_count, current_stop_index=bus.current_stop_index,
        latitude=bus.latitude, longitude=bus.longitude,
        status=bus.status, is_active=bus.is_active,
        crowd_status=status, occupancy_percent=pct,
    )


@router.get("/", response_model=list[BusOut])
def list_buses(active_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Bus)
    if active_only:
        q = q.filter(Bus.is_active == True)
    buses = q.all()
    return [bus_to_out(b) for b in buses]


@router.get("/{bus_id}", response_model=BusDetailOut)
def get_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).get(bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    status, pct = compute_crowd_status(bus.current_passengers, bus.total_capacity)
    out = BusDetailOut(
        id=bus.id, bus_number=bus.bus_number, route_id=bus.route_id,
        total_capacity=bus.total_capacity, seated_capacity=bus.seated_capacity,
        current_passengers=bus.current_passengers, boarded_count=bus.boarded_count,
        alighted_count=bus.alighted_count, current_stop_index=bus.current_stop_index,
        latitude=bus.latitude, longitude=bus.longitude,
        status=bus.status, is_active=bus.is_active,
        crowd_status=status, occupancy_percent=pct,
        route=BusRouteOut.model_validate(bus.route) if bus.route else None,
    )
    return out


@router.get("/route/{route_id}", response_model=list[BusOut])
def get_buses_by_route(route_id: int, db: Session = Depends(get_db)):
    buses = db.query(Bus).filter(Bus.route_id == route_id, Bus.is_active == True).all()
    return [bus_to_out(b) for b in buses]


@router.get("/driver/{driver_id}")
def get_driver_bus(driver_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).filter(Bus.driver_id == driver_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="No bus assigned")
    out = bus_to_out(bus).model_dump()
    route = db.query(BusRoute).get(bus.route_id)
    if route:
        stops = sorted(route.stops, key=lambda s: s.stop_order)
        out["route_info"] = {
            "route_number": route.route_number,
            "name": route.name,
            "source": route.source,
            "destination": route.destination,
        }
        out["stops"] = [
            {"id": s.id, "name": s.name, "stop_order": s.stop_order,
             "estimated_waiting": s.estimated_waiting}
            for s in stops
        ]
    return out
