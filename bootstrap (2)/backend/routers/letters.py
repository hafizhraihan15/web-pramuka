from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

def ensure_member_access(member_id: int, db: Session, current_user):
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh mengakses surat member lain")
    return member

@router.get("/{member_id}", response_model=List[schemas.LetterRequestOut])
def get_letter_requests(member_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Get letter requests for a member"""
    ensure_member_access(member_id, db, current_user)
    return db.query(models.LetterRequest).filter(models.LetterRequest.member_id == member_id).all()

@router.get("/", response_model=List[schemas.LetterRequestOut])
def get_all_letter_requests(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    return db.query(models.LetterRequest).order_by(models.LetterRequest.created_at.desc()).all()

@router.post("/{member_id}", response_model=schemas.LetterRequestOut)
def create_letter_request(member_id: int, body: schemas.LetterRequestCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Create a letter request"""
    ensure_member_access(member_id, db, current_user)
    
    # Create new letter request
    letter = models.LetterRequest(
        member_id=member_id,
        letter_type=body.letter_type,
        purpose=body.purpose,
        recipient=body.recipient
    )
    db.add(letter)
    db.commit()
    db.refresh(letter)
    return letter

@router.put("/{letter_id}", response_model=schemas.LetterRequestOut)
def update_letter_request(letter_id: int, status: str, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    """Update letter request status (admin only)"""
    letter = db.query(models.LetterRequest).filter(models.LetterRequest.id == letter_id).first()
    if not letter:
        raise HTTPException(404, "Permintaan surat tidak ditemukan")
    
    letter.status = status
    db.commit()
    db.refresh(letter)
    return letter

@router.delete("/{letter_id}")
def delete_letter_request(letter_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Delete letter request"""
    letter = db.query(models.LetterRequest).filter(models.LetterRequest.id == letter_id).first()
    if not letter:
        raise HTTPException(404, "Permintaan surat tidak ditemukan")
    ensure_member_access(letter.member_id, db, current_user)
    
    db.delete(letter)
    db.commit()
    return {"message": "Permintaan surat dihapus"}
