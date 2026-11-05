import random
import json
import math
from collections import defaultdict
from sqlalchemy.orm import Session
from models import Bus, BusRoute, BusStop, Festival


class PredictionEngine:
    def __init__(self):
        self.demand_history: dict[int, list[int]] = defaultdict(list)
        self.bus_occupancy_history: dict[int, list[float]] = defaultdict(list)
        self.stop_boarding_history: dict[int, list[int]] = defaultdict(list)
        self.tick_count = 0
        self.baseline_route_demand: dict[int, float] = {}
        self.festival_route_demand: dict[int, float] = {}
        self.festival_active = False
        self.baseline_captured = False

    def reset(self):
        self.demand_history.clear()
        self.bus_occupancy_history.clear()
        self.stop_boarding_history.clear()
        self.tick_count = 0
        self.baseline_route_demand.clear()
        self.festival_route_demand.clear()
        self.festival_active = False
        self.baseline_captured = False

    def record_tick(self, db: Session, buses: list[dict], festival_multiplier: float, tick: int):
        self.tick_count = tick
        is_festival = festival_multiplier > 1.0
        for b in buses:
            self.bus_occupancy_history[b["id"]].append(b["occupancy_percent"])
            if len(self.bus_occupancy_history[b["id"]]) > 60:
                self.bus_occupancy_history[b["id"]] = self.bus_occupancy_history[b["id"]][-60:]

        routes = db.query(BusRoute).all()
        for route in routes:
            route_demand = 0
            for stop in route.stops:
                self.stop_boarding_history[stop.id].append(stop.estimated_waiting)
                if len(self.stop_boarding_history[stop.id]) > 60:
                    self.stop_boarding_history[stop.id] = self.stop_boarding_history[stop.id][-60:]
                route_demand += stop.estimated_waiting

            if not is_festival and tick >= 8:
                prev = self.baseline_route_demand.get(route.id, 0)
                self.baseline_route_demand[route.id] = prev * 0.8 + route_demand * 0.2
                self.baseline_captured = True
            if is_festival:
                self.festival_active = True
                prev = self.festival_route_demand.get(route.id, 0)
                self.festival_route_demand[route.id] = prev * 0.7 + route_demand * 0.3
            else:
                self.festival_active = False

    def predict_overcrowding(self, db: Session) -> list[dict]:
        predictions = []
        buses = db.query(Bus).filter(Bus.is_active == True).all()

        for bus in buses:
            if bus.total_capacity == 0:
                continue
            pct = (bus.current_passengers / bus.total_capacity) * 100
            history = self.bus_occupancy_history.get(bus.id, [])

            if len(history) < 3:
                continue

            recent = history[-5:]
            trend = (recent[-1] - recent[0]) / max(len(recent), 1) if len(recent) > 1 else 0

            route = db.query(BusRoute).get(bus.route_id)
            if not route:
                continue
            stops = sorted(route.stops, key=lambda s: s.stop_order)
            remaining_stops = len(stops) - bus.current_stop_index - 1

            if trend > 0 and pct >= 50:
                ticks_to_full = (100 - pct) / max(trend, 0.1)
                stops_to_full = min(int(ticks_to_full / 2.5), remaining_stops)
                full_stop_idx = min(bus.current_stop_index + max(stops_to_full, 1), len(stops) - 1)
                full_stop = stops[full_stop_idx]

                confidence = min(0.95, 0.5 + (trend / 10) + (pct / 200))
                confidence = round(confidence + random.uniform(-0.03, 0.03), 2)

                if pct >= 75 or (trend > 3 and pct >= 50):
                    predictions.append({
                        "bus_id": bus.id,
                        "bus_number": bus.bus_number,
                        "route_number": route.route_number,
                        "current_occupancy": round(pct, 1),
                        "predicted_full_at_stop": full_stop.name,
                        "predicted_full_at_stop_index": full_stop_idx,
                        "stops_until_full": full_stop_idx - bus.current_stop_index,
                        "confidence": min(confidence, 0.99),
                        "trend": round(trend, 2),
                        "severity": "critical" if pct >= 85 else "warning" if pct >= 70 else "info",
                        "message": f"{bus.bus_number} will reach full capacity by {full_stop.name}",
                    })

        predictions.sort(key=lambda p: -p["current_occupancy"])
        return predictions

    def forecast_stop_demand(self, db: Session) -> list[dict]:
        forecasts = []
        routes = db.query(BusRoute).all()

        cycle = self.tick_count % 80
        is_peak = 10 <= cycle <= 30 or 50 <= cycle <= 70

        for route in routes:
            stops = sorted(route.stops, key=lambda s: s.stop_order)
            for stop in stops:
                history = self.stop_boarding_history.get(stop.id, [])
                avg_waiting = sum(history[-10:]) / max(len(history[-10:]), 1) if history else 0

                base = avg_waiting + random.uniform(-0.5, 1.5)
                if is_peak:
                    base *= 1.5
                if stop.stop_order <= len(stops) // 3:
                    base *= 1.3

                current = max(0, round(base))
                forecast_5 = max(0, round(base * (1.3 if is_peak else 0.9) + random.uniform(-1, 2)))
                forecast_10 = max(0, round(base * (1.5 if is_peak else 0.8) + random.uniform(-1, 3)))

                forecasts.append({
                    "stop_id": stop.id,
                    "stop_name": stop.name,
                    "route_id": route.id,
                    "route_number": route.route_number,
                    "current_waiting": current,
                    "forecast_5min": forecast_5,
                    "forecast_10min": forecast_10,
                    "demand_level": "high" if current >= 8 else "medium" if current >= 4 else "low",
                })

        return forecasts

    def route_heatmap(self, db: Session) -> list[dict]:
        heatmap = []
        routes = db.query(BusRoute).all()

        for route in routes:
            buses = db.query(Bus).filter(Bus.route_id == route.id, Bus.is_active == True).all()
            if not buses:
                continue

            avg_occ = sum(
                (b.current_passengers / b.total_capacity * 100) if b.total_capacity > 0 else 0
                for b in buses
            ) / len(buses)

            total_pax = sum(b.current_passengers for b in buses)
            total_cap = sum(b.total_capacity for b in buses)

            stops = sorted(route.stops, key=lambda s: s.stop_order)
            stop_demand = []
            for stop in stops:
                history = self.stop_boarding_history.get(stop.id, [])
                avg = sum(history[-10:]) / max(len(history[-10:]), 1) if history else 0
                stop_demand.append({
                    "stop_id": stop.id,
                    "stop_name": stop.name,
                    "demand": round(avg, 1),
                    "latitude": stop.latitude,
                    "longitude": stop.longitude,
                })

            congestion = "critical" if avg_occ >= 85 else "high" if avg_occ >= 70 else "moderate" if avg_occ >= 50 else "low"

            heatmap.append({
                "route_id": route.id,
                "route_number": route.route_number,
                "route_name": route.name,
                "avg_occupancy": round(avg_occ, 1),
                "total_passengers": total_pax,
                "total_capacity": total_cap,
                "active_buses": len(buses),
                "congestion_level": congestion,
                "stop_demand": stop_demand,
            })

        heatmap.sort(key=lambda h: -h["avg_occupancy"])
        return heatmap

    def demand_trends(self, db: Session) -> list[dict]:
        trends = []
        window = min(self.tick_count, 40)
        if window < 2:
            return trends

        routes = db.query(BusRoute).all()
        for route in routes:
            stops = sorted(route.stops, key=lambda s: s.stop_order)
            data_points = []
            for t in range(max(0, self.tick_count - window), self.tick_count):
                total_demand = 0
                for stop in stops:
                    history = self.stop_boarding_history.get(stop.id, [])
                    idx = t - max(0, self.tick_count - len(history))
                    if 0 <= idx < len(history):
                        total_demand += history[idx]

                cycle = t % 80
                period = "peak" if (10 <= cycle <= 30 or 50 <= cycle <= 70) else "off-peak"
                data_points.append({
                    "tick": t,
                    "demand": total_demand,
                    "period": period,
                })

            if data_points:
                trends.append({
                    "route_id": route.id,
                    "route_number": route.route_number,
                    "route_name": route.name,
                    "data_points": data_points,
                })

        return trends


    def festival_impact(self, db: Session, festival_id: int) -> dict:
        festival = db.query(Festival).get(festival_id)
        if not festival:
            return {"error": "Festival not found"}

        affected_route_numbers = json.loads(festival.affected_routes) if festival.affected_routes else []
        routes = db.query(BusRoute).all()
        route_map = {r.route_number: r for r in routes}

        route_impacts = []
        for rn in affected_route_numbers:
            route = route_map.get(rn)
            if not route:
                continue
            baseline = self.baseline_route_demand.get(route.id, 0)
            projected = baseline * festival.demand_multiplier
            current_buses = db.query(Bus).filter(
                Bus.route_id == route.id, Bus.is_active == True
            ).all()
            depot_buses = db.query(Bus).filter(
                Bus.route_id == route.id, Bus.is_active == False, Bus.status == "depot"
            ).all()
            total_cap = sum(b.total_capacity for b in current_buses)
            current_pax = sum(b.current_passengers for b in current_buses)
            avg_occ = (current_pax / total_cap * 100) if total_cap > 0 else 0

            projected_occ = avg_occ * festival.demand_multiplier
            needs_extra = projected_occ > 80

            route_impacts.append({
                "route_id": route.id,
                "route_number": route.route_number,
                "route_name": route.name,
                "baseline_demand": round(baseline, 1),
                "projected_demand": round(projected, 1),
                "multiplier": festival.demand_multiplier,
                "current_occupancy": round(avg_occ, 1),
                "projected_occupancy": round(min(projected_occ, 120), 1),
                "active_buses": len(current_buses),
                "depot_buses_available": len(depot_buses),
                "needs_extra_bus": needs_extra,
                "risk_level": "critical" if projected_occ >= 100 else "high" if projected_occ >= 80 else "moderate" if projected_occ >= 60 else "low",
            })

        route_impacts.sort(key=lambda r: -r["projected_occupancy"])

        recommendations = []
        for ri in route_impacts:
            if ri["needs_extra_bus"]:
                depot_bus = db.query(Bus).filter(
                    Bus.route_id == ri["route_id"], Bus.is_active == False, Bus.status == "depot"
                ).first()
                recommendations.append({
                    "id": f"festival-{festival_id}-{ri['route_id']}",
                    "type": "festival_dispatch",
                    "priority": "critical" if ri["risk_level"] == "critical" else "warning",
                    "route_number": ri["route_number"],
                    "route_name": ri["route_name"],
                    "message": f"Pre-deploy bus on Route {ri['route_number']} for {festival.name}",
                    "detail": f"Expected {festival.demand_multiplier}x demand — projected {ri['projected_occupancy']:.0f}% occupancy",
                    "can_dispatch": depot_bus is not None,
                    "depot_bus_id": depot_bus.id if depot_bus else None,
                })

        return {
            "festival": {
                "id": festival.id,
                "name": festival.name,
                "date": festival.date,
                "demand_multiplier": festival.demand_multiplier,
                "description": festival.description,
                "affected_routes": affected_route_numbers,
            },
            "route_impacts": route_impacts,
            "recommendations": recommendations,
            "summary": {
                "total_affected_routes": len(route_impacts),
                "routes_needing_extra": sum(1 for r in route_impacts if r["needs_extra_bus"]),
                "max_projected_occupancy": max((r["projected_occupancy"] for r in route_impacts), default=0),
                "avg_projected_occupancy": round(
                    sum(r["projected_occupancy"] for r in route_impacts) / max(len(route_impacts), 1), 1
                ),
            },
        }

    def normal_vs_festival_comparison(self, db: Session) -> list[dict]:
        routes = db.query(BusRoute).all()
        comparison = []
        for route in routes:
            baseline = self.baseline_route_demand.get(route.id, 0)
            festival = self.festival_route_demand.get(route.id, 0)
            if baseline <= 0 and festival <= 0:
                continue
            increase = ((festival - baseline) / max(baseline, 0.1)) * 100 if baseline > 0 else 0
            comparison.append({
                "route_id": route.id,
                "route_number": route.route_number,
                "route_name": route.name,
                "normal_demand": round(baseline, 1),
                "festival_demand": round(festival, 1),
                "increase_percent": round(increase, 1),
            })
        comparison.sort(key=lambda c: -c["increase_percent"])
        return comparison


prediction_engine = PredictionEngine()
