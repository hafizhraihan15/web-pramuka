from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from io import BytesIO
from pathlib import Path
import uuid
from PIL import Image, UnidentifiedImageError
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()
UPLOAD_DIR = Path("uploads/announcements")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

def save_announcement_photo(photo: Optional[UploadFile]) -> Optional[str]:
    if not photo:
        return None
    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Format file tidak valid. Gunakan JPG, PNG, atau WEBP")
    content = photo.file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "Ukuran file maksimal 5MB")
    try:
        image = Image.open(BytesIO(content))
        image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "File bukan gambar yang valid")

    filename = f"{uuid.uuid4()}{ALLOWED_TYPES[photo.content_type]}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/announcements/{filename}"

@router.get("/", response_model=List[schemas.AnnouncementOut])
def get_announcements(limit: int = 6, db: Session = Depends(get_db)):
    return db.query(models.Announcement).filter(models.Announcement.is_active == True).order_by(models.Announcement.created_at.desc()).limit(limit).all()

@router.get("/all", response_model=List[schemas.AnnouncementOut])
def get_all_announcements(db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()

@router.post("/", response_model=schemas.AnnouncementOut)
def create_announcement(body: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = models.Announcement(**body.model_dump(), created_by=current_user.email)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/upload", response_model=schemas.AnnouncementOut)
def create_announcement_upload(
    title: str = Form(...),
    content: str = Form(...),
    image_url: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    link_label: str = Form("Daftar Sekarang"),
    is_active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    uploaded_image_url = save_announcement_photo(photo)
    item = models.Announcement(
        title=title,
        content=content,
        image_url=uploaded_image_url or image_url,
        link_url=link_url,
        link_label=link_label,
        is_active=is_active,
        created_by=current_user.email,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=schemas.AnnouncementOut)
def update_announcement(item_id: int, body: schemas.AnnouncementCreate, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Announcement).filter(models.Announcement.id == item_id).first()
    if not item:
        raise HTTPException(404, "Pengumuman tidak ditemukan")
    for k, v in body.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}/upload", response_model=schemas.AnnouncementOut)
def update_announcement_upload(
    item_id: int,
    title: str = Form(...),
    content: str = Form(...),
    image_url: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    link_label: str = Form("Daftar Sekarang"),
    is_active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin),
):
    item = db.query(models.Announcement).filter(models.Announcement.id == item_id).first()
    if not item:
        raise HTTPException(404, "Pengumuman tidak ditemukan")
    uploaded_image_url = save_announcement_photo(photo)
    item.title = title
    item.content = content
    item.image_url = uploaded_image_url or image_url
    item.link_url = link_url
    item.link_label = link_label
    item.is_active = is_active
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_announcement(item_id: int, db: Session = Depends(get_db), current_user=Depends(auth_utils.get_current_admin)):
    item = db.query(models.Announcement).filter(models.Announcement.id == item_id).first()
    if not item:
        raise HTTPException(404, "Pengumuman tidak ditemukan")
    db.delete(item)
    db.commit()
    return {"message": "Pengumuman dihapus"}
