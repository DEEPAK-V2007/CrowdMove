import asyncio
import random
import datetime
import json
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bus, BusRoute, BusStop, Alert
from ws_manager import manager
from prediction_engine import prediction_engine


class SimulationEngine:
    def __init__(self):
        self.running = False
        self.speed = 1.0  # 1x = 5s per tick, 2x = 2.5s, etc.
        self.tick_count = 0
        self.task: asyncio.Task | None = None
        self.festival_mode: str | None = None
        self.festival_multiplier = 1.0

    @property
    def state(self):
        return {
            "running": self.running,
            "speed": self.speed,
            "tick_count": self.tick_count,
            "festival_mode": self.festival_mode,
            "festival_multiplier": self.festival_multiplier,
        }

    def start(self, loop: asyncio.AbstractEventLoop | None = None):
        if self.running:
            return
        self.running = True
        target_loop = loop or asyncio.get_event_loop()
        self.task = target_loop.create_task(self._loop())

    def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            self.task = None

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(speed, 5.0))

    def set_festival(self, name: str | None, multiplier: float = 1.0):
        self.festival_mode = name
        self.festival_multiplier = multiplier if name else 1.0

    def reset(self, db: Session):
        self.stop()
        self.tick_count = 0
        self.festival_mode = None
        self.festival_multiplier = 1.0
        prediction_engine.reset()
        buses = db.query(Bus).all()
        for bus in buses:
            bus.current_passengers = 0
            bus.boarded_count = 0
            bus.alighted_count = 0
            bus.current_stop_index = 0
            route = db.query(BusRoute).get(bus.route_id)
            if route and route.stops:
                bus.latitude = route.stops[0].latitude
                bus.longitude = route.stops[0].longitude
        db.query(Alert).filter(Alert.is_resolved == False).update({"is_resolved": True})
        db.commit()

    async def _loop(self):
        while self.running:
            try:
                db = SessionLocal()
                try:
                    await self._tick(db)
                    db.commit()
                finally:
                    db.close()
                self.tick_count += 1
                await asyncio.sleep(5.0 / self.speed)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Simulation error: {e}")
                await asyncio.sleep(2)

    async def _tick(self, db: Session):
        buses = db.query(Bus).filter(Bus.is_active == True).all()
        bus_updates = []

        for bus in buses:
            route = db.query(BusRoute).get(bus.route_id)
            if not route or not route.stops:
                continue

            stops = sorted(route.stops, key=lambda s: s.stop_order)
            num_stops = len(stops)

            # Move bus to next stop every 2-4 ticks
            move_interval = random.randint(2, 4)
            if self.tick_count % move_interval == 0:
                bus.current_stop_index = (bus.current_stop_index + 1) % num_stops
                current_stop = stops[bus.current_stop_index]
                bus.latitude = current_stop.latitude
                bus.longitude = current_stop.longitude

                # Simulate alighting at this stop
                if bus.current_passengers > 0:
                    max_alight = max(1, bus.current_passengers // 4)
                    alight = random.randint(0, max_alight)
                    # More people alight at later stops and at the terminal
                    if bus.current_stop_index >= num_stops - 2:
                        alight = random.randint(max_alight, bus.current_passengers)
                    bus.current_passengers = max(0, bus.current_passengers - alight)
                    bus.alighted_count += alight

                # Simulate boarding at this stop
                base_demand = random.randint(1, 8)
                # Apply festival multiplier
                demand = int(base_demand * self.festival_multiplier)
                # Peak hours (ticks 10-30, 50-70 simulate morning/evening rush)
                cycle = self.tick_count % 80
                if 10 <= cycle <= 30 or 50 <= cycle <= 70:
                    demand = int(demand * 1.6)
                # First and middle stops have more boarding
                if bus.current_stop_index <= num_stops // 3:
                    demand = int(demand * 1.3)

                available = bus.total_capacity - bus.current_passengers
                boarded = min(demand, available)
                left_waiting = demand - boarded
                bus.current_passengers += boarded
                bus.boarded_count += boarded

                # Update estimated waiting at the stop
                current_stop.estimated_waiting = max(0, left_waiting + random.randint(0, 3))

            # Compute crowd status
            if bus.total_capacity > 0:
                pct = (bus.current_passengers / bus.total_capacity) * 100
            else:
                pct = 0

            if pct < 50:
                crowd = "green"
            elif pct < 75:
                crowd = "yellow"
            elif pct < 90:
                crowd = "orange"
            else:
                crowd = "red"

            bus_updates.append({
                "id": bus.id,
                "bus_number": bus.bus_number,
                "route_id": bus.route_id,
                "current_passengers": bus.current_passengers,
                "total_capacity": bus.total_capacity,
                "seated_capacity": bus.seated_capacity,
                "boarded_count": bus.boarded_count,
                "alighted_count": bus.alighted_count,
                "current_stop_index": bus.current_stop_index,
                "latitude": bus.latitude,
                "longitude": bus.longitude,
                "occupancy_percent": round(pct, 1),
                "crowd_status": crowd,
                "status": bus.status,
                "is_active": bus.is_active,
            })

            # Generate alerts
            if pct >= 90 and self.tick_count % 3 == 0:
                existing = db.query(Alert).filter(
                    Alert.bus_id == bus.id,
                    Alert.type == "overcrowding",
                    Alert.is_resolved == False,
                ).first()
                if not existing:
                    alert = Alert(
                        type="overcrowding",
                        severity="critical",
                        message=f"{bus.bus_number} at {round(pct)}% capacity — stop {stops[bus.current_stop_index].name}",
                        bus_id=bus.id,
                        route_id=bus.route_id,
                    )
                    db.add(alert)
                    await manager.broadcast("alert", {
                        "type": "overcrowding", "severity": "critical",
                        "message": alert.message, "bus_id": bus.id,
                    })

            elif pct >= 75 and self.tick_count % 5 == 0:
                existing = db.query(Alert).filter(
                    Alert.bus_id == bus.id,
                    Alert.type == "approaching_capacity",
                    Alert.is_resolved == False,
                ).first()
                if not existing:
                    alert = Alert(
                        type="approaching_capacity",
                        severity="warning",
                        message=f"{bus.bus_number} approaching capacity at {round(pct)}% — {stops[bus.current_stop_index].name}",
                        bus_id=bus.id,
                        route_id=bus.route_id,
                    )
                    db.add(alert)

        # Bus bunching detection: two buses on same route at same/adjacent stop
        route_buses: dict[int, list] = {}
        for b in bus_updates:
            route_buses.setdefault(b["route_id"], []).append(b)
        for route_id, rbs in route_buses.items():
            if len(rbs) < 2:
                continue
            if self.tick_count < 6:
                continue
            rbs_sorted = sorted(rbs, key=lambda x: x["current_stop_index"])
            for i in range(len(rbs_sorted) - 1):
                gap = abs(rbs_sorted[i+1]["current_stop_index"] - rbs_sorted[i]["current_stop_index"])
                if gap <= 1 and self.tick_count % 8 == 0:
                    existing = db.query(Alert).filter(
                        Alert.route_id == route_id,
                        Alert.type == "bunching",
                        Alert.is_resolved == False,
                    ).first()
                    if not existing:
                        alert = Alert(
                            type="bunching",
                            severity="warning",
                            message=f"Bus bunching detected: {rbs_sorted[i]['bus_number']} and {rbs_sorted[i+1]['bus_number']} too close on route",
                            route_id=route_id,
                        )
                        db.add(alert)
                        await manager.broadcast("alert", {
                            "type": "bunching", "severity": "warning",
                            "message": alert.message,
                        })

        # Feed prediction engine
        prediction_engine.record_tick(db, bus_updates, self.festival_multiplier, self.tick_count)

        # Broadcast bus state to all WebSocket clients
        await manager.broadcast("buses_update", bus_updates)

        # Compute and broadcast dashboard stats
        active = [b for b in bus_updates if b["is_active"]]
        stats = {
            "total_buses": len(bus_updates) + db.query(Bus).filter(Bus.is_active == False).count(),
            "active_buses": len(active),
            "total_passengers": sum(b["current_passengers"] for b in active),
            "overcrowded_buses": sum(1 for b in active if b["occupancy_percent"] >= 90),
            "approaching_capacity": sum(1 for b in active if 75 <= b["occupancy_percent"] < 90),
            "total_routes": db.query(BusRoute).count(),
        }
        await manager.broadcast("stats_update", stats)
        await manager.broadcast("sim_state", self.state)

        # Broadcast predictions every 3 ticks
        if self.tick_count >= 5 and self.tick_count % 3 == 0:
            predictions = {
                "overcrowding": prediction_engine.predict_overcrowding(db),
                "heatmap": prediction_engine.route_heatmap(db),
            }
            await manager.broadcast("predictions_update", predictions)


sim_engine = SimulationEngine()
