import json
from sqlalchemy.orm import Session
from auth_utils import hash_password
from models import User, SmartCard, BusRoute, BusStop, Bus, Festival, MetroStation


def seed_database(db: Session):
    if db.query(User).first():
        return

    admin = User(name="Admin Controller", email="admin@crowdmove.in", phone="9876543210",
                 password_hash=hash_password("test123"), role="admin")
    db.add(admin)

    drivers_data = [
        ("Rajesh Kumar", "rajesh@crowdmove.in", "9876543211"),
        ("Suresh Babu", "suresh@crowdmove.in", "9876543212"),
        ("Murugan S", "murugan@crowdmove.in", "9876543213"),
        ("Karthik R", "karthik@crowdmove.in", "9876543214"),
        ("Senthil V", "senthil@crowdmove.in", "9876543215"),
        ("Dhanush M", "dhanush@crowdmove.in", "9876543216"),
        ("Prabhu K", "prabhu@crowdmove.in", "9876543217"),
        ("Vignesh A", "vignesh@crowdmove.in", "9876543218"),
        ("Arjun N", "arjun@crowdmove.in", "9876543219"),
        ("Manoj P", "manoj@crowdmove.in", "9876543220"),
    ]
    drivers = []
    for name, email, phone in drivers_data:
        d = User(name=name, email=email, phone=phone,
                 password_hash=hash_password("test123"), role="driver")
        db.add(d)
        drivers.append(d)

    passengers_data = [
        ("Priya M", "priya@gmail.com", "9000000001"),
        ("Arun K", "arun@gmail.com", "9000000002"),
        ("Divya S", "divya@gmail.com", "9000000003"),
        ("Vikram R", "vikram@gmail.com", "9000000004"),
        ("Lakshmi N", "lakshmi@gmail.com", "9000000005"),
        ("Ganesh T", "ganesh@gmail.com", "9000000006"),
        ("Meena P", "meena@gmail.com", "9000000007"),
        ("Ravi V", "ravi@gmail.com", "9000000008"),
        ("Deepa K", "deepa@gmail.com", "9000000009"),
        ("Kumar S", "kumar@gmail.com", "9000000010"),
    ]
    passengers = []
    for name, email, phone in passengers_data:
        p = User(name=name, email=email, phone=phone,
                 password_hash=hash_password("test123"), role="passenger")
        db.add(p)
        passengers.append(p)

    db.flush()

    for i, p in enumerate(passengers):
        card = SmartCard(passenger_id=p.id, card_number=f"CM{2024000 + i + 1:07d}",
                         balance=500.0)
        db.add(card)

    routes_data = [
        {
            "route_number": "1C",
            "name": "Parry's Corner to T. Nagar",
            "source": "Parry's Corner",
            "destination": "T. Nagar",
            "distance": 8.5,
            "stops": [
                ("Parry's Corner", 13.0827, 80.2707),
                ("High Court", 13.0878, 80.2785),
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore", 13.0732, 80.2609),
                ("Nungambakkam", 13.0569, 80.2425),
                ("Kodambakkam", 13.0520, 80.2280),
                ("T. Nagar", 13.0418, 80.2341),
            ]
        },
        {
            "route_number": "5B",
            "name": "Broadway to Adyar",
            "source": "Broadway",
            "destination": "Adyar",
            "distance": 12.0,
            "stops": [
                ("Broadway", 13.0878, 80.2785),
                ("Chepauk", 13.0627, 80.2823),
                ("Triplicane", 13.0580, 80.2772),
                ("Mylapore", 13.0368, 80.2676),
                ("Mandaveli", 13.0270, 80.2620),
                ("Adyar Signal", 13.0067, 80.2565),
                ("Adyar Depot", 12.9990, 80.2530),
            ]
        },
        {
            "route_number": "12G",
            "name": "CMBT to Tambaram",
            "source": "CMBT",
            "destination": "Tambaram",
            "distance": 25.0,
            "stops": [
                ("CMBT", 13.0694, 80.2002),
                ("Ashok Nagar", 13.0382, 80.2120),
                ("Saidapet", 13.0220, 80.2218),
                ("Guindy", 13.0067, 80.2206),
                ("Alandur", 12.9955, 80.2059),
                ("Pallavaram", 12.9667, 80.1500),
                ("Chromepet", 12.9516, 80.1419),
                ("Tambaram", 12.9249, 80.1278),
            ]
        },
        {
            "route_number": "18A",
            "name": "Koyambedu to Thiruvanmiyur",
            "source": "Koyambedu",
            "destination": "Thiruvanmiyur",
            "distance": 20.0,
            "stops": [
                ("Koyambedu", 13.0694, 80.1948),
                ("Vadapalani", 13.0516, 80.2122),
                ("Ashok Nagar", 13.0382, 80.2120),
                ("T. Nagar", 13.0418, 80.2341),
                ("Alwarpet", 13.0336, 80.2508),
                ("Mylapore", 13.0368, 80.2676),
                ("Besant Nagar", 13.0002, 80.2670),
                ("Thiruvanmiyur", 12.9830, 80.2694),
            ]
        },
        {
            "route_number": "21H",
            "name": "Central to OMR Siruseri",
            "source": "Chennai Central",
            "destination": "Siruseri",
            "distance": 28.0,
            "stops": [
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore", 13.0732, 80.2609),
                ("Saidapet", 13.0220, 80.2218),
                ("Guindy", 13.0067, 80.2206),
                ("Velachery", 12.9815, 80.2180),
                ("Sholinganallur", 12.9010, 80.2279),
                ("Navalur", 12.8450, 80.2268),
                ("Siruseri", 12.8230, 80.2199),
            ]
        },
        {
            "route_number": "27C",
            "name": "Anna Nagar to Porur",
            "source": "Anna Nagar",
            "destination": "Porur",
            "distance": 14.0,
            "stops": [
                ("Anna Nagar Tower", 13.0850, 80.2101),
                ("Thirumangalam", 13.0858, 80.2258),
                ("Koyambedu", 13.0694, 80.1948),
                ("Valasaravakkam", 13.0489, 80.1710),
                ("Virugambakkam", 13.0523, 80.1900),
                ("Porur Junction", 13.0385, 80.1568),
            ]
        },
        {
            "route_number": "29C",
            "name": "Perambur to Velachery",
            "source": "Perambur",
            "destination": "Velachery",
            "distance": 22.0,
            "stops": [
                ("Perambur", 13.1070, 80.2324),
                ("Kellys", 13.0900, 80.2510),
                ("Chetpet", 13.0750, 80.2420),
                ("Nungambakkam", 13.0569, 80.2425),
                ("T. Nagar", 13.0418, 80.2341),
                ("Saidapet", 13.0220, 80.2218),
                ("Guindy", 13.0067, 80.2206),
                ("Velachery", 12.9815, 80.2180),
            ]
        },
        {
            "route_number": "M70",
            "name": "Tondiarpet to Airport",
            "source": "Tondiarpet",
            "destination": "Airport",
            "distance": 24.0,
            "stops": [
                ("Tondiarpet", 13.1130, 80.2880),
                ("Parry's Corner", 13.0827, 80.2707),
                ("Chennai Central", 13.0836, 80.2753),
                ("Egmore", 13.0732, 80.2609),
                ("Nungambakkam", 13.0569, 80.2425),
                ("Guindy", 13.0067, 80.2206),
                ("Alandur", 12.9955, 80.2059),
                ("Tirusulam", 12.9792, 80.1736),
                ("Airport", 12.9941, 80.1709),
            ]
        },
        {
            "route_number": "15F",
            "name": "Ambattur to Adyar",
            "source": "Ambattur",
            "destination": "Adyar",
            "distance": 22.0,
            "stops": [
                ("Ambattur OT", 13.1143, 80.1548),
                ("Anna Nagar West", 13.0900, 80.1950),
                ("Anna Nagar Tower", 13.0850, 80.2101),
                ("Aminjikarai", 13.0700, 80.2280),
                ("Kodambakkam", 13.0520, 80.2280),
                ("T. Nagar", 13.0418, 80.2341),
                ("Adyar Signal", 13.0067, 80.2565),
                ("Adyar Depot", 12.9990, 80.2530),
            ]
        },
        {
            "route_number": "47D",
            "name": "Avadi to Tambaram",
            "source": "Avadi",
            "destination": "Tambaram",
            "distance": 35.0,
            "stops": [
                ("Avadi", 13.1145, 80.1010),
                ("Ambattur", 13.1143, 80.1548),
                ("Koyambedu", 13.0694, 80.1948),
                ("Vadapalani", 13.0516, 80.2122),
                ("Ashok Nagar", 13.0382, 80.2120),
                ("Guindy", 13.0067, 80.2206),
                ("Alandur", 12.9955, 80.2059),
                ("Chromepet", 12.9516, 80.1419),
                ("Tambaram", 12.9249, 80.1278),
            ]
        },
    ]

    all_buses = []
    for i, rd in enumerate(routes_data):
        route = BusRoute(
            route_number=rd["route_number"],
            name=rd["name"],
            source=rd["source"],
            destination=rd["destination"],
            total_distance_km=rd["distance"],
        )
        db.add(route)
        db.flush()

        for j, (stop_name, lat, lng) in enumerate(rd["stops"]):
            stop = BusStop(name=stop_name, route_id=route.id, stop_order=j,
                           latitude=lat, longitude=lng, estimated_waiting=0)
            db.add(stop)

        capacities = [(50, 30), (60, 36), (45, 28)]
        for k in range(3):
            cap, seated = capacities[k % len(capacities)]
            bus = Bus(
                bus_number=f"TN01-{rd['route_number']}-{k + 1:03d}",
                route_id=route.id,
                driver_id=drivers[i % len(drivers)].id if k == 0 else None,
                total_capacity=cap,
                seated_capacity=seated,
                current_passengers=0,
                current_stop_index=0,
                latitude=rd["stops"][0][1],
                longitude=rd["stops"][0][2],
                status="active" if k < 2 else "depot",
                is_active=k < 2,
            )
            db.add(bus)
            all_buses.append(bus)

    festivals = [
        Festival(name="Pongal", date="2027-01-14", demand_multiplier=2.5,
                 affected_routes=json.dumps(["1C", "5B", "12G", "18A", "29C"]),
                 description="Tamil harvest festival — heavy outbound travel to native towns"),
        Festival(name="Deepavali", date="2026-11-14", demand_multiplier=2.0,
                 affected_routes=json.dumps(["18A", "12G", "47D", "21H"]),
                 description="Festival of lights — shopping and family travel surge"),
        Festival(name="Tamil New Year", date="2027-04-14", demand_multiplier=1.8,
                 affected_routes=json.dumps(["1C", "27C", "M70", "15F"]),
                 description="Tamil Puthandu — temple visits and cultural events"),
        Festival(name="Christmas", date="2026-12-25", demand_multiplier=1.5,
                 affected_routes=json.dumps(["5B", "1C", "29C"]),
                 description="Christmas celebrations — church and shopping traffic"),
        Festival(name="Republic Day", date="2027-01-26", demand_multiplier=1.3,
                 affected_routes=json.dumps(["M70", "1C", "21H"]),
                 description="Parade and government events near Marina Beach"),
    ]
    db.add_all(festivals)

    metro_stations = [
        # Chennai Metro Blue Line (Wimco Nagar to Airport)
        MetroStation(name="Wimco Nagar", station_type="metro", line="Blue Line", latitude=13.1515, longitude=80.3053),
        MetroStation(name="Tiruvottiyur", station_type="metro", line="Blue Line", latitude=13.1570, longitude=80.3000),
        MetroStation(name="Washermanpet", station_type="metro", line="Blue Line", latitude=13.1186, longitude=80.2817),
        MetroStation(name="High Court Metro", station_type="metro", line="Blue Line", latitude=13.0878, longitude=80.2785),
        MetroStation(name="Chennai Central Metro", station_type="metro", line="Blue Line", latitude=13.0836, longitude=80.2750),
        MetroStation(name="Government Estate", station_type="metro", line="Blue Line", latitude=13.0730, longitude=80.2710),
        MetroStation(name="LIC Metro", station_type="metro", line="Blue Line", latitude=13.0630, longitude=80.2680),
        MetroStation(name="Thousand Lights", station_type="metro", line="Blue Line", latitude=13.0560, longitude=80.2560),
        MetroStation(name="AG-DMS", station_type="metro", line="Blue Line", latitude=13.0450, longitude=80.2510),
        MetroStation(name="Teynampet", station_type="metro", line="Blue Line", latitude=13.0380, longitude=80.2470),
        MetroStation(name="Nandanam Metro", station_type="metro", line="Blue Line", latitude=13.0300, longitude=80.2380),
        MetroStation(name="Saidapet Metro", station_type="metro", line="Blue Line", latitude=13.0220, longitude=80.2280),
        MetroStation(name="Guindy Metro", station_type="metro", line="Blue Line", latitude=13.0067, longitude=80.2200),
        MetroStation(name="Alandur Metro", station_type="metro", line="Blue Line", latitude=12.9955, longitude=80.2050),
        MetroStation(name="Airport Metro", station_type="metro", line="Blue Line", latitude=12.9830, longitude=80.1760),
        # Chennai Metro Green Line (CMBT to St Thomas Mount)
        MetroStation(name="CMBT Metro", station_type="metro", line="Green Line", latitude=13.0694, longitude=80.2002),
        MetroStation(name="Arumbakkam", station_type="metro", line="Green Line", latitude=13.0700, longitude=80.2110),
        MetroStation(name="Vadapalani Metro", station_type="metro", line="Green Line", latitude=13.0516, longitude=80.2122),
        MetroStation(name="Ashok Nagar Metro", station_type="metro", line="Green Line", latitude=13.0382, longitude=80.2120),
        MetroStation(name="Ekkattuthangal", station_type="metro", line="Green Line", latitude=13.0170, longitude=80.2060),
        MetroStation(name="St Thomas Mount Metro", station_type="metro", line="Green Line", latitude=13.0070, longitude=80.1980),
        # Chennai Suburban Railway
        MetroStation(name="Chennai Beach", station_type="suburban", line="Beach-Tambaram", latitude=13.0900, longitude=80.2900),
        MetroStation(name="Chennai Fort", station_type="suburban", line="Beach-Tambaram", latitude=13.0840, longitude=80.2870),
        MetroStation(name="Chennai Park", station_type="suburban", line="Beach-Tambaram", latitude=13.0790, longitude=80.2610),
        MetroStation(name="Egmore Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0732, longitude=80.2609),
        MetroStation(name="Nungambakkam Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0569, longitude=80.2425),
        MetroStation(name="Kodambakkam Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0520, longitude=80.2280),
        MetroStation(name="Mambalam", station_type="suburban", line="Beach-Tambaram", latitude=13.0380, longitude=80.2230),
        MetroStation(name="Saidapet Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0220, longitude=80.2218),
        MetroStation(name="Guindy Suburban", station_type="suburban", line="Beach-Tambaram", latitude=13.0067, longitude=80.2206),
        MetroStation(name="St Thomas Mount", station_type="suburban", line="Beach-Tambaram", latitude=13.0010, longitude=80.1990),
        MetroStation(name="Chromepet Suburban", station_type="suburban", line="Beach-Tambaram", latitude=12.9516, longitude=80.1419),
        MetroStation(name="Tambaram Suburban", station_type="suburban", line="Beach-Tambaram", latitude=12.9249, longitude=80.1278),
        MetroStation(name="Velachery Suburban", station_type="suburban", line="Beach-Velachery", latitude=12.9815, longitude=80.2180),
        MetroStation(name="Perambur Suburban", station_type="suburban", line="Beach-Perambur", latitude=13.1070, longitude=80.2324),
        MetroStation(name="Avadi Suburban", station_type="suburban", line="Beach-Avadi", latitude=13.1145, longitude=80.1010),
    ]
    db.add_all(metro_stations)

    db.commit()
    print(f"Seeded: 1 admin, {len(drivers)} drivers, {len(passengers)} passengers, "
          f"{len(routes_data)} routes, {len(all_buses)} buses, {len(festivals)} festivals, "
          f"{len(metro_stations)} metro/suburban stations")
