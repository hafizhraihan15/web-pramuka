from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

import auth as auth_utils
import models
import schemas
from database import get_db


router = APIRouter()


@router.post("/", response_model=schemas.MemberOut)
def register_member(body: schemas.MemberCreate, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    auth_utils.throttle(f"member_register:{client}", max_attempts=3, window_seconds=300)

    existing = db.query(models.Member).filter(models.Member.nis == body.nis).first()
    if existing:
        raise HTTPException(400, "NIS sudah pernah mendaftar")

    item = models.Member(
        name=body.name,
        nis=body.nis,
        class_name=body.class_name,
        phone=body.phone,
        address=body.address,
        motivation=body.motivation,
        ambalan_id=body.ambalan_id,
        status="pending",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/ambalans/", response_model=List[schemas.AmbalanOut])
def get_ambalans(db: Session = Depends(get_db)):
    return db.query(models.Ambalan).all()


@router.get("/ambalans/{ambalan_id}/members", response_model=List[schemas.MemberOut])
def get_members_by_ambalan(
    ambalan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    ambalan = db.query(models.Ambalan).filter(models.Ambalan.id == ambalan_id).first()
    if not ambalan:
        raise HTTPException(404, "Ambalan tidak ditemukan")
    return db.query(models.Member).filter(models.Member.ambalan_id == ambalan_id).all()


@router.get("/", response_model=List[schemas.MemberOut])
def get_members(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    q = db.query(models.Member)
    if status:
        q = q.filter(models.Member.status == status)
    return q.order_by(models.Member.created_at.desc()).all()


@router.get("/{item_id}", response_model=schemas.MemberOut)
def get_member(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    item = db.query(models.Member).filter(models.Member.id == item_id).first()
    if not item:
        raise HTTPException(404, "Anggota tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and item.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh melihat data anggota lain")
    return item


@router.patch("/{item_id}", response_model=schemas.MemberOut)
def update_member_status(
    item_id: int,
    body: schemas.MemberStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    item = db.query(models.Member).filter(models.Member.id == item_id).first()
    if not item:
        raise HTTPException(404, "Anggota tidak ditemukan")
    item.status = body.status
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_member(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Member).filter(models.Member.id == item_id).first()
    if not item:
        raise HTTPException(404, "Anggota tidak ditemukan")
    db.delete(item)
    db.commit()
    return {"message": "Data anggota dihapus"}
