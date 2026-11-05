import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import MetroStation, Bus, BusRoute, BusStop

router = APIRouter(prefix="/api/multimodal", tags=["multimodal"])


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/stations")
def list_stations(db: Session = Depends(get_db)):
    stations = db.query(MetroStation).all()
    return [
        {
            "id": s.id, "name": s.name, "station_type": s.station_type,
            "line": s.line, "latitude": s.latitude, "longitude": s.longitude,
        }
        for s in stations
    ]


@router.get("/nearby")
def nearby_stations(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(3.5),
    db: Session = Depends(get_db),
):
    stations = db.query(MetroStation).all()
    results = []
    for s in stations:
        dist = haversine(lat, lng, s.latitude, s.longitude)
        if dist <= radius_km:
            results.append({
                "id": s.id, "name": s.name, "station_type": s.station_type,
                "line": s.line, "latitude": s.latitude, "longitude": s.longitude,
                "distance_km": round(dist, 2),
                "walk_minutes": max(1, round(dist / 0.075)),  # ~4.5 km/h walking
            })
    return sorted(results, key=lambda x: x["distance_km"])


@router.get("/for-bus/{bus_id}")
def alternatives_for_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.query(Bus).get(bus_id)
    if not bus:
        return {"error": "Bus not found"}

    route = db.query(BusRoute).get(bus.route_id)
    stops = sorted(route.stops, key=lambda s: s.stop_order) if route else []
    current_stop_name = stops[bus.current_stop_index].name if stops and bus.current_stop_index < len(stops) else "Unknown"

    pct = (bus.current_passengers / bus.total_capacity * 100) if bus.total_capacity > 0 else 0

    nearby = nearby_stations(lat=bus.latitude, lng=bus.longitude, radius_km=3.5, db=db)

    if pct >= 90:
        suggestion = f"{bus.bus_number} is full — take alternative transit nearby"
    elif pct >= 75:
        suggestion = f"{bus.bus_number} is nearly full — alternatives available"
    else:
        suggestion = f"{bus.bus_number} has space — no alternative needed"

    return {
        "bus_number": bus.bus_number,
        "occupancy": round(pct, 1),
        "current_stop": current_stop_name,
        "suggestion": suggestion,
        "alternatives": nearby[:5],
    }
