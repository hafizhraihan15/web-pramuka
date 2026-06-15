from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib, os, binascii
import time
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY in {"fallback-secret", "change-me", "your-secret-key"} or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY harus diisi di .env dengan nilai random minimal 32 karakter")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv("ADMIN_EMAILS", os.getenv("ADMIN_EMAIL", "admin@pramukainhi.id")).split(",")
    if email.strip()
}

# PBKDF2-SHA256 settings
PBKDF2_ITERATIONS = 100_000
SALT_BYTES = 16
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_ATTEMPTS = 10
_rate_limit_store: dict[str, list[float]] = {}

bearer_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256. Returns formatted string:
    pbkdf2_sha256$<iterations>$<salt_hex>$<dk_hex>
    """
    salt = os.urandom(SALT_BYTES)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"

def verify_password(plain: str, hashed: str) -> bool:
    try:
        parts = hashed.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = binascii.unhexlify(parts[2])
        dk = binascii.unhexlify(parts[3])
        new_dk = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, iterations)
        return hmac_compare(new_dk, dk)
    except Exception:
        return False

def hmac_compare(a: bytes, b: bytes) -> bool:
    """Constant-time comparison to avoid timing attacks."""
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kadaluarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses admin diperlukan"
        )
    return current_user

def throttle(key: str, max_attempts: int = RATE_LIMIT_MAX_ATTEMPTS, window_seconds: int = RATE_LIMIT_WINDOW_SECONDS):
    now = time.monotonic()
    attempts = [ts for ts in _rate_limit_store.get(key, []) if now - ts < window_seconds]
    if len(attempts) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak percobaan. Coba lagi sebentar lagi."
        )
    attempts.append(now)
    _rate_limit_store[key] = attempts
