from dataclasses import dataclass
from secrets import token_urlsafe

from pwdlib import PasswordHash

from app.exceptions.auth import InvalidAPIKeyError

password_hash = PasswordHash.recommended()

@dataclass
class APIKey:
    key: str
    key_id: str

def generate_api_key()-> APIKey:
    key_id = token_urlsafe(12)
    secret_key = token_urlsafe(32)

    return APIKey(
        key=f"mb_live_{key_id}_{secret_key}",
        key_id=key_id
    )

def hash_api_key(secret: str) -> str:
    return password_hash.hash(secret)

def parse_api_key(api_key: str) -> tuple[str, str]:
    if not api_key.startswith("mb_live_"):
        raise InvalidAPIKeyError("Invalid API key format")
    
    parts = api_key.split("_", 3)

    if len(parts) != 4:
        raise InvalidAPIKeyError("Invalid API key format")

    _, _, key_id, secret = parts

    return key_id, secret

def verify_api_key(secret: str, hashed_secret: str) -> bool:
    return password_hash.verify(secret, hashed_secret)
