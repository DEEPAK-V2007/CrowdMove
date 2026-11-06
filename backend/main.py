import random
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from seed import seed_database
from models import Bus, BusStop, User, SmartCard
from ws_manager import manager
from routes import auth, buses, passengers, dashboard, simulation, predictions, multimodal
from simulation import sim_engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TN-ITIS SEERPAYANAM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(buses.router)
app.include_router(passengers.router)
app.include_router(dashboard.router)
app.include_router(simulation.router)
app.include_router(predictions.router)
app.include_router(multimodal.router)


@app.on_event("startup")
async def startup():
    db = SessionLocal()
    try:
        # 1. Seed base database if empty
        seed_database(db)

        # 2. Populate active buses with realistic live initial passenger loads & stop demand
        active_buses = db.query(Bus).filter(Bus.is_active == True).all()
        needs_initial_loads = sum(b.current_passengers for b in active_buses) == 0
        for i, b in enumerate(active_buses):
            if needs_initial_loads or b.current_passengers == 0:
                # Distribute realistic occupancy: low, moderate, high, near critical
                ratio = [0.38, 0.62, 0.78, 0.92, 0.45, 0.68, 0.94, 0.52][i % 8]
                b.current_passengers = int(b.total_capacity * ratio)
                b.boarded_count = b.current_passengers
                b.alighted_count = int(b.current_passengers * 0.2)

        stops = db.query(BusStop).all()
        for s in stops:
            if s.estimated_waiting == 0:
                s.estimated_waiting = random.randint(4, 15)

        db.commit()
    finally:
        db.close()

    # 3. Automatically start live real-time simulation immediately on startup!
    sim_engine.start()
    print("[Startup] TN-ITIS Simulation Engine auto-started: Real-time broadcast active.")


@app.on_event("shutdown")
def shutdown():
    sim_engine.stop()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": "TN-ITIS SEERPAYANAM",
        "simulation_running": sim_engine.running,
        "tick_count": sim_engine.tick_count
    }
