import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

import models
from database import Base, engine
from routers import announcements, attendance, auth, gallery, letters, members, messages, programs


Base.metadata.create_all(bind=engine)
os.makedirs("uploads/gallery", exist_ok=True)


def apply_lightweight_migrations():
    inspector = inspect(engine)
    if "program_registrations" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("program_registrations")}
    if "status" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE program_registrations "
                    "ADD COLUMN status ENUM('pending','accepted','rejected') DEFAULT 'pending'"
                )
            )


apply_lightweight_migrations()

IS_PRODUCTION = os.getenv("ENV", "development").lower() == "production"

app = FastAPI(
    title="Pramuka MAN 1 INHIL API",
    description="Backend API untuk website Pramuka MAN 1 INHIL",
    version="2.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://[::1]:5173",
    "http://[::1]:5174",
    "http://[::1]:3000",
]
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["Gallery"])
app.include_router(programs.router, prefix="/api/programs", tags=["Programs"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(letters.router, prefix="/api/letters", tags=["Letters"])


@app.get("/")
def root():
    return {
        "app": "Pramuka MAN 1 INHIL API",
        "version": "2.0.0",
        "docs": None if IS_PRODUCTION else "/docs",
        "status": "running",
    }
