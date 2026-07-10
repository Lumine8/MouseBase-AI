import base64
import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from secrets import token_hex
from uuid import UUID

import jwt
from cryptography.fernet import Fernet
from pwdlib import PasswordHash

from app.core.config import settings
from app.exceptions.auth import InvalidAPIKeyError

password_hash = PasswordHash.recommended()


def _get_fernet() -> Fernet:
    raw = settings.API_KEY_ENCRYPTION_KEY or settings.SECRET_KEY
    key = hashlib.sha256(raw.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_api_key(api_key: str) -> str:
    return _get_fernet().encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


@dataclass
class APIKey:
    key: str
    key_id: str


def generate_api_key() -> APIKey:
    key_id = token_hex(8)
    secret_key = token_hex(16)
    return APIKey(
        key=f"mb_live_{key_id}_{secret_key}",
        key_id=key_id,
    )


def hash_api_key(secret: str) -> str:
    return password_hash.hash(secret)


def parse_api_key(api_key: str) -> tuple[str, str]:
    if not api_key.startswith("mb_live_"):
        raise InvalidAPIKeyError()
    parts = api_key.split("_", 3)
    if len(parts) != 4:
        raise InvalidAPIKeyError()
    _, _, key_id, secret = parts
    return key_id, secret


def verify_api_key(secret: str, hashed_secret: str) -> bool:
    return password_hash.verify(secret, hashed_secret)


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_EXPIRY_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_email_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "email",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def create_password_reset_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "password_reset",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def verify_access_token(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type", "access") not in ("access",):
            from app.exceptions.auth import InvalidTokenError

            raise InvalidTokenError()
        return UUID(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        from app.exceptions.auth import InvalidTokenError

        raise InvalidTokenError()


def verify_email_token(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "email":
            from app.exceptions.auth import InvalidTokenError

            raise InvalidTokenError()
        return UUID(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        from app.exceptions.auth import InvalidTokenError

        raise InvalidTokenError()


def verify_password_reset_token(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            from app.exceptions.auth import InvalidTokenError

            raise InvalidTokenError()
        return UUID(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        from app.exceptions.auth import InvalidTokenError

        raise InvalidTokenError()
