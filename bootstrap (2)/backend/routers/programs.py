from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

@router.get("/", response_model=List[schemas.ProgramOut])
def get_programs(db: Session = Depends(get_db)):
    return db.query(models.Program).filter(models.Program.is_active == True).order_by(models.Program.sort_order).all()

@router.get("/all", response_model=List[schemas.ProgramOut])
def get_all_programs(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    return db.query(models.Program).order_by(models.Program.sort_order).all()

@router.post("/", response_model=schemas.ProgramOut)
def create_program(body: schemas.ProgramCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = models.Program(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=schemas.ProgramOut)
def update_program(item_id: int, body: schemas.ProgramCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Program).filter(models.Program.id == item_id).first()
    if not item:
        raise HTTPException(404, "Program tidak ditemukan")
    for k, v in body.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_program(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Program).filter(models.Program.id == item_id).first()
    if not item:
        raise HTTPException(404, "Program tidak ditemukan")
    db.delete(item)
    db.commit()
    return {"message": "Program dihapus"}

@router.get("/registrations/all")
def get_all_program_registrations(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    rows = (
        db.query(models.ProgramRegistration, models.Member, models.Program)
        .join(models.Member, models.ProgramRegistration.member_id == models.Member.id)
        .join(models.Program, models.ProgramRegistration.program_id == models.Program.id)
        .order_by(models.ProgramRegistration.registered_at.desc())
        .all()
    )
    return [
        {
            "id": registration.id,
            "member_id": member.id,
            "member_name": member.name,
            "member_class": member.class_name,
            "program_id": program.id,
            "program_title": program.title,
            "status": registration.status,
            "registered_at": registration.registered_at,
        }
        for registration, member, program in rows
    ]

@router.patch("/registrations/{registration_id}", response_model=schemas.ProgramRegistrationOut)
def update_program_registration_status(
    registration_id: int,
    body: schemas.ProgramRegistrationStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    registration = db.query(models.ProgramRegistration).filter(models.ProgramRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(404, "Pendaftaran program tidak ditemukan")
    registration.status = body.status
    db.commit()
    db.refresh(registration)
    return registration

@router.get("/{member_id}/registrations")
def get_member_program_registrations(
    member_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh melihat data member lain")

    rows = (
        db.query(models.ProgramRegistration, models.Program)
        .join(models.Program, models.ProgramRegistration.program_id == models.Program.id)
        .filter(models.ProgramRegistration.member_id == member_id)
        .order_by(models.ProgramRegistration.registered_at.desc())
        .all()
    )
    return [
        {
            "id": registration.id,
            "member_id": member_id,
            "program_id": program.id,
            "program_title": program.title,
            "status": registration.status,
            "registered_at": registration.registered_at,
        }
        for registration, program in rows
    ]

# ── Program Registrations ──────────────────────────
@router.post("/{program_id}/register/{member_id}", response_model=schemas.ProgramRegistrationOut)
def register_program(program_id: int, member_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Register member to a program"""
    # Check if program exists
    program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not program:
        raise HTTPException(404, "Program tidak ditemukan")
    
    # Check if member exists
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh mendaftarkan member lain")
    
    # Check if already registered
    existing = db.query(models.ProgramRegistration).filter(
        models.ProgramRegistration.member_id == member_id,
        models.ProgramRegistration.program_id == program_id
    ).first()
    
    if existing:
        raise HTTPException(400, "Sudah terdaftar di program ini")
    
    # Create registration
    registration = models.ProgramRegistration(
        member_id=member_id,
        program_id=program_id,
        status="pending"
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration

@router.get("/{member_id}/registered", response_model=List[schemas.ProgramOut])
def get_member_registered_programs(member_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Get programs registered by a member"""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh melihat data member lain")

    registrations = db.query(models.ProgramRegistration).filter(
        models.ProgramRegistration.member_id == member_id,
        models.ProgramRegistration.status == "accepted"
    ).all()
    
    program_ids = [reg.program_id for reg in registrations]
    return db.query(models.Program).filter(models.Program.id.in_(program_ids)).all()

@router.delete("/{program_id}/unregister/{member_id}")
def unregister_program(program_id: int, member_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_user)):
    """Unregister member from a program"""
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(404, "Member tidak ditemukan")
    if current_user.email.lower() not in auth_utils.ADMIN_EMAILS and member.user_id != current_user.id:
        raise HTTPException(403, "Tidak boleh membatalkan pendaftaran member lain")

    registration = db.query(models.ProgramRegistration).filter(
        models.ProgramRegistration.member_id == member_id,
        models.ProgramRegistration.program_id == program_id
    ).first()
    
    if not registration:
        raise HTTPException(404, "Pendaftaran tidak ditemukan")
    
    db.delete(registration)
    db.commit()
    return {"message": "Pendaftaran dibatalkan"}
