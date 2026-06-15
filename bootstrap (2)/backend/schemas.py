from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class LoginRequest(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    nis: str = Field(min_length=1, max_length=50)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_email: str
    is_admin: bool = False
    member_id: Optional[int] = None


class GalleryOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str]
    image_url: str
    uploaded_by: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class ProgramCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    category: str = Field(default="Rutin", max_length=100)
    description: str = Field(min_length=1, max_length=5000)
    schedule: Optional[str] = Field(default=None, max_length=100)
    icon: str = Field(default="camp", max_length=20)
    sort_order: int = Field(default=99, ge=0, le=9999)
    is_active: bool = True


class ProgramOut(ProgramCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class AmbalanOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    nis: str = Field(min_length=1, max_length=50)
    class_name: str = Field(min_length=1, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=1000)
    motivation: Optional[str] = Field(default=None, max_length=2000)
    ambalan_id: Optional[int] = None


class MemberStatusUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected"]


class MemberOut(BaseModel):
    id: int
    name: str
    nis: str
    class_name: str
    phone: Optional[str]
    address: Optional[str]
    motivation: Optional[str]
    status: str
    ambalan_id: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=255)
    message: str = Field(min_length=1, max_length=5000)


class MessageOut(BaseModel):
    id: int
    name: str
    email: str
    subject: Optional[str]
    message: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1, max_length=5000)
    image_url: Optional[str] = Field(default=None, max_length=2000)
    link_url: Optional[str] = Field(default=None, max_length=2000)
    link_label: str = Field(default="Daftar Sekarang", max_length=100)
    is_active: bool = True


class AnnouncementOut(AnnouncementCreate):
    id: int
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}


class AttendanceCreate(BaseModel):
    attendance_date: date
    status: Literal["Hadir", "Izin", "Alpha"] = "Hadir"
    note: Optional[str] = Field(default=None, max_length=1000)


class AttendanceOut(BaseModel):
    id: int
    member_id: int
    attendance_date: date
    status: str
    note: Optional[str]
    recorded_at: datetime
    model_config = {"from_attributes": True}


class ProgramRegistrationCreate(BaseModel):
    program_id: int


class ProgramRegistrationOut(BaseModel):
    id: int
    member_id: int
    program_id: int
    status: str
    registered_at: datetime
    model_config = {"from_attributes": True}


class ProgramRegistrationStatusUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected"]


class LetterRequestCreate(BaseModel):
    letter_type: str = Field(min_length=1, max_length=100)
    purpose: str = Field(min_length=1, max_length=2000)
    recipient: Optional[str] = Field(default=None, max_length=255)


class LetterRequestOut(BaseModel):
    id: int
    member_id: int
    letter_type: str
    purpose: str
    recipient: Optional[str]
    status: str
    file_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}
