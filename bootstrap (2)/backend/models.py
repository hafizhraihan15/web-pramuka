from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, DateTime, Date, func, ForeignKey, UniqueConstraint
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, server_default=func.now())

class Gallery(Base):
    __tablename__ = "gallery"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    category    = Column(String(100), default="Umum")
    description = Column(Text)
    image_url   = Column(Text, nullable=False)
    uploaded_by = Column(String(255))
    created_at  = Column(DateTime, server_default=func.now())

class Program(Base):
    __tablename__ = "programs"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    category    = Column(String(100), default="Rutin")
    description = Column(Text, nullable=False)
    schedule    = Column(String(100))
    icon        = Column(String(20), default="🏕️")
    sort_order  = Column(Integer, default=99)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Ambalan(Base):
    __tablename__ = "ambalans"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at  = Column(DateTime, server_default=func.now())

class Member(Base):
    __tablename__ = "members"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False)
    nis        = Column(String(50), nullable=False)
    ambalan_id = Column(Integer, ForeignKey("ambalans.id"))
    user_id    = Column(Integer, ForeignKey("users.id"))
    class_name = Column("class", String(50), nullable=False)
    phone      = Column(String(20))
    address    = Column(Text)
    motivation = Column(Text)
    status     = Column(Enum("pending", "accepted", "rejected"), default="pending")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False)
    subject    = Column(String(255))
    message    = Column(Text, nullable=False)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Announcement(Base):
    __tablename__ = "announcements"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    content     = Column(Text, nullable=False)
    image_url   = Column(Text)
    link_url    = Column(Text)
    link_label  = Column(String(100), default="Daftar Sekarang")
    is_active   = Column(Boolean, default=True)
    created_by  = Column(String(255))
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Attendance(Base):
    __tablename__ = "attendance"
    id                = Column(Integer, primary_key=True, index=True)
    member_id         = Column(Integer, ForeignKey("members.id"), nullable=False)
    attendance_date   = Column(Date, nullable=False)
    status            = Column(Enum("Hadir", "Izin", "Alpha"), default="Hadir")
    note              = Column(Text)
    recorded_at       = Column(DateTime, server_default=func.now())
    __table_args__    = (UniqueConstraint('member_id', 'attendance_date', name='unique_daily_attendance'),)

class ProgramRegistration(Base):
    __tablename__ = "program_registrations"
    id           = Column(Integer, primary_key=True, index=True)
    member_id    = Column(Integer, ForeignKey("members.id"), nullable=False)
    program_id   = Column(Integer, ForeignKey("programs.id"), nullable=False)
    status       = Column(Enum("pending", "accepted", "rejected"), default="pending")
    certificate_approved = Column(Boolean, default=False)
    registered_at = Column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint('member_id', 'program_id', name='unique_registration'),)

class LetterRequest(Base):
    __tablename__ = "letter_requests"
    id          = Column(Integer, primary_key=True, index=True)
    member_id   = Column(Integer, ForeignKey("members.id"), nullable=False)
    letter_type = Column(String(100), nullable=False)
    purpose     = Column(Text, nullable=False)
    recipient   = Column(String(255))
    status      = Column(Enum("Pending", "Selesai"), default="Pending")
    file_url    = Column(Text)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())
