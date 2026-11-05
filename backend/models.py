import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(15))
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # passenger, driver, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    smart_card = relationship("SmartCard", back_populates="passenger", uselist=False)
    driver_assignment = relationship("Bus", back_populates="driver", uselist=False)


class SmartCard(Base):
    __tablename__ = "smart_cards"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    card_number = Column(String(20), unique=True, nullable=False, index=True)
    balance = Column(Float, default=500.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    passenger = relationship("User", back_populates="smart_card")
    transactions = relationship("Transaction", back_populates="card")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("smart_cards.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # debit, credit
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    card = relationship("SmartCard", back_populates="transactions")


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_number = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    total_distance_km = Column(Float, default=0)

    stops = relationship("BusStop", back_populates="route", order_by="BusStop.stop_order")
    buses = relationship("Bus", back_populates="route")


class BusStop(Base):
    __tablename__ = "bus_stops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False)
    stop_order = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    estimated_waiting = Column(Integer, default=0)

    route = relationship("BusRoute", back_populates="stops")


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(20), unique=True, nullable=False)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_capacity = Column(Integer, default=50)
    seated_capacity = Column(Integer, default=30)
    current_passengers = Column(Integer, default=0)
    boarded_count = Column(Integer, default=0)
    alighted_count = Column(Integer, default=0)
    current_stop_index = Column(Integer, default=0)
    latitude = Column(Float, default=0)
    longitude = Column(Float, default=0)
    status = Column(String(20), default="active")  # active, inactive, depot
    is_active = Column(Boolean, default=True)

    route = relationship("BusRoute", back_populates="buses")
    driver = relationship("User", back_populates="driver_assignment")
    boarding_records = relationship("BoardingRecord", back_populates="bus")


class BoardingRecord(Base):
    __tablename__ = "boarding_records"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("bus_stops.id"), nullable=True)
    action = Column(String(10), nullable=False)  # board, alight
    fare = Column(Float, default=0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    bus = relationship("Bus", back_populates="boarding_records")


class Festival(Base):
    __tablename__ = "festivals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date = Column(String(10), nullable=False)
    demand_multiplier = Column(Float, default=1.5)
    affected_routes = Column(Text, default="[]")
    description = Column(String(255))


class MetroStation(Base):
    __tablename__ = "metro_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    station_type = Column(String(20), nullable=False)  # metro, suburban
    line = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(30), nullable=False)  # overcrowding, bunching, festival, dispatch
    severity = Column(String(10), nullable=False)  # info, warning, critical
    message = Column(String(500), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=True)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
