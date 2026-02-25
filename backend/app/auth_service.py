"""
Auth Service — JWT issuance/validation and credential hashing.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .config import settings
from .models import User
from .repository import get_user_by_email, add_user

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Returns user_id (sub) or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def register_user(db: Session, name: str, email: str, password: str) -> User:
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    return add_user(db, user)


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not user.password_hash:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")
    return user
