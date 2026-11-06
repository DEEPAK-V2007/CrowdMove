from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt

from database import get_db
from models import User
from schemas import LoginRequest, LoginResponse, UserOut
from auth_utils import verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = "crowdmove-hackathon-secret-2024"
ALGORITHM = "HS256"


def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).get(int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.email.strip()
    
    # 1. Look up by email
    user = db.query(User).filter(User.email.ilike(identifier)).first()
    
    # 2. Look up by Smart Card Number (for commuters)
    if not user:
        from models import SmartCard
        card = db.query(SmartCard).filter(SmartCard.card_number.ilike(identifier)).first()
        if card and card.passenger:
            user = card.passenger

    # 3. Look up by Badge number or role shortcuts
    if not user:
        ident_upper = identifier.upper()
        if ident_upper in ["OP-9821", "CONDUCTOR", "CONDUCTOR@CROWDMOVE.IN"]:
            user = db.query(User).filter(User.email == "conductor@crowdmove.in").first()
        elif ident_upper in ["D51192", "RAJESH", "DRIVER"]:
            user = db.query(User).filter(User.email == "rajesh@crowdmove.in").first()
        elif ident_upper in ["ADMIN", "CONTROLLER"]:
            user = db.query(User).filter(User.email == "admin@crowdmove.in").first()
        elif ident_upper in ["PRIYA", "PASSENGER"]:
            user = db.query(User).filter(User.email == "priya@gmail.com").first()

    if not user:
        raise HTTPException(status_code=401, detail="Account or Smart Card ID not recognized")

    token = create_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return UserOut.model_validate(user)
