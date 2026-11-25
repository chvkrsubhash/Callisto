from datetime import datetime, timedelta, timezone
import re
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext

from ..config import settings

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

ROLE_RANK = {"viewer": 1, "commenter": 2, "editor": 3, "owner": 4}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, email: str, expires_minutes: Optional[int] = None) -> str:
    exp = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload = {"sub": user_id, "email": email, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        ) from exc


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
        )
    return decode_access_token(creds.credentials)


def require_min_role(user_role: str, required_role: str) -> None:
    if ROLE_RANK.get(user_role, 0) < ROLE_RANK.get(required_role, 99):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires '{required_role}' permission",
        )


def sanitize_svg_or_xml(raw: str) -> str:
    """Strip XXE DOCTYPE/ENTITY declarations, <script> tags, and inline event handlers."""
    if len(raw.encode("utf-8")) > settings.max_import_bytes:
        raise HTTPException(status_code=413, detail="Imported payload exceeds size limit")
    cleaned = re.sub(r"<!DOCTYPE[^>]*>", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"<!ENTITY[^>]*>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\son[a-z]+\s*=\s*(['\"]).*?\1", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"javascript:", "", cleaned, flags=re.IGNORECASE)
    return cleaned

