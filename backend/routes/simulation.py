import asyncio
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Festival
from simulation import sim_engine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/state")
def get_state():
    return sim_engine.state


@router.post("/start")
async def start_sim():
    loop = asyncio.get_running_loop()
    sim_engine.start(loop)
    return {"success": True, "state": sim_engine.state}


@router.post("/stop")
def stop_sim():
    sim_engine.stop()
    return {"success": True, "state": sim_engine.state}


@router.post("/speed")
def set_speed(speed: float):
    sim_engine.set_speed(speed)
    return {"success": True, "speed": sim_engine.speed}


@router.post("/reset")
def reset_sim(db: Session = Depends(get_db)):
    sim_engine.reset(db)
    return {"success": True, "state": sim_engine.state}


@router.post("/festival/{festival_id}")
def activate_festival(festival_id: int, db: Session = Depends(get_db)):
    if festival_id == 0:
        sim_engine.set_festival(None)
        return {"success": True, "festival": None}
    festival = db.query(Festival).get(festival_id)
    if not festival:
        return {"success": False, "message": "Festival not found"}
    sim_engine.set_festival(festival.name, festival.demand_multiplier)
    return {
        "success": True,
        "festival": festival.name,
        "multiplier": festival.demand_multiplier,
        "affected_routes": json.loads(festival.affected_routes),
    }
