from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
import models, schemas, auth as auth_utils
import os, uuid
from pathlib import Path
from PIL import Image, UnidentifiedImageError
from io import BytesIO

router = APIRouter()
UPLOAD_DIR = Path("uploads/gallery")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

@router.get("/", response_model=List[schemas.GalleryOut])
def get_gallery(
    category: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(models.Gallery)
    if category and category != "all":
        q = q.filter(models.Gallery.category == category)
    return q.order_by(models.Gallery.created_at.desc()).limit(limit).all()

@router.post("/", response_model=schemas.GalleryOut)
def upload_gallery(
    title: str = Form(...),
    category: str = Form("Umum"),
    description: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin)
):
    # Validate file type
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

    # Save file
    ext = ALLOWED_TYPES[photo.content_type]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(content)

    image_url = f"/uploads/gallery/{filename}"

    item = models.Gallery(
        title=title,
        category=category,
        description=description,
        image_url=image_url,
        uploaded_by=current_user.email
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_gallery(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_admin)
):
    item = db.query(models.Gallery).filter(models.Gallery.id == item_id).first()
    if not item:
        raise HTTPException(404, "Foto tidak ditemukan")

    # Delete file
    if item.image_url and item.image_url.startswith("/uploads/"):
        path = Path(item.image_url.lstrip("/"))
        if path.exists():
            path.unlink()

    db.delete(item)
    db.commit()
    return {"message": "Foto berhasil dihapus"}
