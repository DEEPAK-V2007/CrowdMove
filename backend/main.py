from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from seed import seed_database
from ws_manager import manager
from routes import auth, buses, passengers, dashboard, simulation, predictions, multimodal

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrowdMove API", version="1.0.0")

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
def startup():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


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
    return {"status": "ok", "app": "CrowdMove"}
