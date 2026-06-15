from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

@router.post("/", response_model=schemas.MessageOut)
def send_message(body: schemas.MessageCreate, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    auth_utils.throttle(f"message:{client}", max_attempts=5, window_seconds=300)
    item = models.Message(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=List[schemas.MessageOut])
def get_messages(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    return db.query(models.Message).order_by(models.Message.created_at.desc()).all()

@router.patch("/{item_id}/read")
def mark_read(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Message).filter(models.Message.id == item_id).first()
    if not item:
        raise HTTPException(404, "Pesan tidak ditemukan")
    item.is_read = True
    db.commit()
    return {"message": "Pesan ditandai sudah dibaca"}

@router.delete("/{item_id}")
def delete_message(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Message).filter(models.Message.id == item_id).first()
    if not item:
        raise HTTPException(404, "Pesan tidak ditemukan")
    db.delete(item)
    db.commit()
    return {"message": "Pesan dihapus"}
