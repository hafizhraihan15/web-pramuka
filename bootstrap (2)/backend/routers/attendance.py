from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

def ensure_member_access(member_id: int, db: Session, current_user):
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh mengakses absensi member lain")
    return member

@router.get("/")
def get_all_attendance(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    rows = (
        db.query(models.Attendance, models.Member)
        .join(models.Member, models.Attendance.member_id == models.Member.id)
        .order_by(models.Attendance.attendance_date.desc(), models.Attendance.recorded_at.desc())
        .all()
    )
    return [
        {
            "id": attendance.id,
            "member_id": member.id,
            "member_name": member.name,
            "member_class": member.class_name,
            "attendance_date": attendance.attendance_date,
            "status": attendance.status,
            "note": attendance.note,
            "recorded_at": attendance.recorded_at,
        }
        for attendance, member in rows
    ]

@router.get("/{member_id}", response_model=List[schemas.AttendanceOut])
def get_attendance(member_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Get attendance records for a member"""
    ensure_member_access(member_id, db, current_user)
    return db.query(models.Attendance).filter(models.Attendance.member_id == member_id).all()

@router.post("/{member_id}", response_model=schemas.AttendanceOut)
def create_attendance(member_id: int, body: schemas.AttendanceCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Create attendance record (max 1 per day per member)"""
    ensure_member_access(member_id, db, current_user)
    
    # Check if already has attendance for today
    existing = db.query(models.Attendance).filter(
        models.Attendance.member_id == member_id,
        models.Attendance.attendance_date == body.attendance_date
    ).first()
    
    if existing:
        raise HTTPException(400, "Sudah ada absensi untuk tanggal ini")
    
    # Create new attendance
    attendance = models.Attendance(
        member_id=member_id,
        attendance_date=body.attendance_date,
        status=body.status,
        note=body.note
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.put("/{attendance_id}", response_model=schemas.AttendanceOut)
def update_attendance(attendance_id: int, body: schemas.AttendanceCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Update attendance record"""
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(404, "Absensi tidak ditemukan")
    ensure_member_access(attendance.member_id, db, current_user)
    
    attendance.status = body.status
    attendance.note = body.note
    db.commit()
    db.refresh(attendance)
    return attendance

@router.delete("/{attendance_id}")
def delete_attendance(attendance_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Delete attendance record"""
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(404, "Absensi tidak ditemukan")
    ensure_member_access(attendance.member_id, db, current_user)
    
    db.delete(attendance)
    db.commit()
    return {"message": "Absensi dihapus"}
