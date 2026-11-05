from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SmartCard, Transaction, Bus, BoardingRecord
from schemas import SmartCardOut, TransactionOut, ScanRequest, ScanResponse, RechargeRequest

router = APIRouter(prefix="/api/passengers", tags=["passengers"])

BASE_FARE = 10.0


@router.get("/card/{passenger_id}", response_model=SmartCardOut)
def get_card(passenger_id: int, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.passenger_id == passenger_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return SmartCardOut.model_validate(card)


@router.get("/transactions/{card_id}", response_model=list[TransactionOut])
def get_transactions(card_id: int, db: Session = Depends(get_db)):
    txns = (db.query(Transaction)
            .filter(Transaction.card_id == card_id)
            .order_by(Transaction.created_at.desc())
            .limit(50).all())
    return [TransactionOut.model_validate(t) for t in txns]


@router.post("/scan", response_model=ScanResponse)
def scan_card(req: ScanRequest, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_number).first()
    if not card:
        return ScanResponse(success=False, message="Card not found", current_passengers=0)
    if not card.is_active:
        return ScanResponse(success=False, message="Card is inactive", current_passengers=0)

    bus = db.query(Bus).get(req.bus_id)
    if not bus:
        return ScanResponse(success=False, message="Bus not found", current_passengers=0)

    if req.action == "board":
        if bus.current_passengers >= bus.total_capacity:
            return ScanResponse(success=False, message="Bus is at full capacity",
                                current_passengers=bus.current_passengers)
        if card.balance < BASE_FARE:
            return ScanResponse(success=False, message="Insufficient balance",
                                current_passengers=bus.current_passengers)

        bus.current_passengers += 1
        bus.boarded_count += 1
        card.balance -= BASE_FARE

        db.add(Transaction(card_id=card.id, amount=BASE_FARE, type="debit",
                           description=f"Boarded {bus.bus_number}"))
        db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                              stop_id=req.stop_id, action="board", fare=BASE_FARE))
        db.commit()
        return ScanResponse(success=True, message="Boarding successful",
                            current_passengers=bus.current_passengers, fare=BASE_FARE)

    elif req.action == "alight":
        if bus.current_passengers > 0:
            bus.current_passengers -= 1
        bus.alighted_count += 1

        db.add(BoardingRecord(passenger_id=card.passenger_id, bus_id=bus.id,
                              stop_id=req.stop_id, action="alight"))
        db.commit()
        return ScanResponse(success=True, message="Alighted successfully",
                            current_passengers=bus.current_passengers)

    return ScanResponse(success=False, message="Invalid action", current_passengers=0)


@router.post("/recharge")
def recharge_card(req: RechargeRequest, db: Session = Depends(get_db)):
    card = db.query(SmartCard).filter(SmartCard.card_number == req.card_number).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if req.amount <= 0 or req.amount > 5000:
        raise HTTPException(status_code=400, detail="Invalid amount")

    card.balance += req.amount
    db.add(Transaction(card_id=card.id, amount=req.amount, type="credit",
                       description="Card recharge"))
    db.commit()
    return {"success": True, "new_balance": card.balance}
