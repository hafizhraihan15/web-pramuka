from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    email = body.email.lower()
    auth_utils.throttle(f"login:{client}:{email}", max_attempts=5, window_seconds=60)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not auth_utils.verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah"
        )
    
    # Find member linked to this user
    member = db.query(models.Member).filter(models.Member.user_id == user.id).first()
    is_admin = user.email.lower() in auth_utils.ADMIN_EMAILS
    
    token = auth_utils.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_email": user.email,
        "is_admin": is_admin,
        "member_id": member.id if member else None
    }

@router.post("/register", response_model=schemas.TokenResponse)
def register_member_account(body: schemas.RegisterRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    auth_utils.throttle(f"register:{client}", max_attempts=3, window_seconds=300)

    email = body.email.lower()
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    member = db.query(models.Member).filter(models.Member.nis == body.nis).first()
    if not member:
        raise HTTPException(status_code=404, detail="NIS belum terdaftar sebagai anggota")
    if member.status != "accepted":
        raise HTTPException(status_code=400, detail="Pendaftaran anggota belum diterima admin")
    if member.user_id:
        raise HTTPException(status_code=400, detail="Anggota ini sudah punya akun")

    user = models.User(email=email, password_hash=auth_utils.hash_password(body.password))
    db.add(user)
    db.flush()
    member.user_id = user.id
    db.commit()
    db.refresh(member)

    token = auth_utils.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_email": user.email,
        "is_admin": False,
        "member_id": member.id,
    }

@router.get("/me")
def get_me(current_user=Depends(auth_utils.get_current_user)):
    return {"email": current_user.email, "id": current_user.id}
