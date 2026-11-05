# CrowdMove — Demo Walkthrough (5 minutes)

## Prerequisites

```bash
# Terminal 1 — Backend
cd backend
rm -f crowdmove.db          # fresh DB
./venv/bin/uvicorn main:app --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev                  # opens on http://localhost:5173
```

---

## Step 1 — Passenger View (1 min)

1. Open `http://localhost:5173` in a browser
2. Click **Passenger** quick-login button
3. Show the **Smart Card** tab — card number, balance (₹500), QR code
4. Tap **Live Buses** tab — buses are listed but idle (simulation not started yet)
5. Tap a quick-recharge button (₹100) — balance updates, toast confirms
6. Tap **History** — the recharge transaction appears

---

## Step 2 — Conductor Scanner (30s)

1. Open a **new tab** → `http://localhost:5173/scanner`
2. Enter the passenger card number manually (e.g. `CM2024001`)
3. Select any bus and tap **Board** → passenger count increments, fare deducted
4. Switch back to the passenger tab — balance decreased, transaction logged

---

## Step 3 — Driver View (30s)

1. Open a new tab → login as **Driver** (quick-login)
2. See the assigned bus, occupancy gauge at 0%, route info
3. Note: once simulation starts, the gauge will move in real-time

---

## Step 4 — Admin Dashboard + Start Simulation (1.5 min)

1. Open a new tab → login as **Admin**
2. **Overview** tab shows fleet stats (all zeros initially)
3. Click **Start Simulation** in the control panel (top-right)
4. Watch numbers animate: active buses, total passengers, overcrowded count
5. Switch to **Map** tab — colored bus dots move along routes; metro/rail squares visible
6. Switch to **Fleet** tab — bus table with live occupancy bars and crowd badges
7. Switch to **Predictions** tab — overcrowding predictions and route heatmap appear
8. Watch alerts panel fill with "approaching capacity" and "overcrowding" warnings

---

## Step 5 — Admin Dispatch (30s)

1. Switch to **Dispatch** tab
2. System recommendations appear (e.g. "Deploy extra bus on Route 18A")
3. Click **Dispatch** on a recommendation — toast confirms, bus activated

---

## Step 6 — Festival Mode (30s)

1. Switch to **Festivals** tab
2. Click **Activate** next to "Deepavali" — demand spikes to 2.0x
3. Watch the overview stats surge, more overcrowding alerts fire
4. View **Festival Impact** analysis — projected demand per route
5. See normal-vs-festival comparison chart

---

## Step 7 — Multimodal Alternatives (30s)

1. Switch to the **Passenger** tab (or open a new one)
2. Go to **Live Buses** — some buses now show orange/red badges
3. For a crowded bus (orange or red), tap **Show nearby Metro/Rail**
4. See alternatives: station name, line, distance, walk time
5. Message: "TN01-18A-001 is full — take alternative transit nearby"
6. Back on the admin **Map** — blue (M) squares = metro, green (S) = suburban rail

---

## Key Talking Points

- **Real-time simulation** — all data flows through WebSockets, updates every 5 seconds
- **AI-powered predictions** — overcrowding predicted stops ahead, demand forecasting
- **Festival intelligence** — system automatically recommends extra buses during events
- **Multimodal integration** — suggests metro/suburban rail when buses are full
- **QR ticketing** — digital smart card with fare deduction and transaction history
- **Driver awareness** — live occupancy gauge with audio alert at capacity
- **Command center** — admin sees everything: fleet, map, predictions, dispatch, alerts

---

## Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@crowdmove.in | test123 |
| Driver | rajesh@crowdmove.in | test123 |
| Passenger | priya@gmail.com | test123 |

All accounts use password: `test123`
