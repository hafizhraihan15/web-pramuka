import getpass
import os

from dotenv import load_dotenv

import models
from auth import hash_password
from database import Base, SessionLocal, engine


load_dotenv()
Base.metadata.create_all(bind=engine)

email = os.getenv("ADMIN_EMAIL") or input("Admin email: ").strip()
password = os.getenv("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")

if not email:
    raise SystemExit("Admin email wajib diisi")
if len(password) < 8:
    raise SystemExit("Admin password minimal 8 karakter")

db = SessionLocal()
try:
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        print(f"Admin sudah ada: {email}")
    else:
        user = models.User(email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        print(f"Admin berhasil dibuat: {email}")
finally:
    db.close()
