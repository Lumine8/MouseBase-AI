from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, verify_access_token
from app.exceptions.auth import (
    EmailAlreadyExistsError,
    InvalidAPIKeyError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.models.project import Project
from app.models.user import User
from app.models.subscription import PlanType
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserResponse
from app.services.subscription_service import create_subscription

password_hash = PasswordHash.recommended()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def signup(self, request: SignupRequest) -> AuthResponse:
        existing = await self.db.execute(
            select(User).where(User.email == request.email)
        )
        if existing.scalar_one_or_none():
            raise EmailAlreadyExistsError()

        hashed = password_hash.hash(request.password)
        user = User(
            email=request.email,
            password_hash=hashed,
            full_name=request.full_name,
        )
        self.db.add(user)
        await self.db.flush()

        # Auto-verify in development mode
        if settings.ENVIRONMENT == "development":
            user.email_verified = True

        await create_subscription(self.db, user.id, PlanType.FREE)
        await self.db.flush()

        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token(user.id)
        return AuthResponse(
            token=token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, request: LoginRequest) -> AuthResponse:
        result = await self.db.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()

        if user is None or not password_hash.verify(
            request.password, user.password_hash
        ):
            raise InvalidCredentialsError()

        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()

        token = create_access_token(user.id)
        return AuthResponse(
            token=token,
            user=UserResponse.model_validate(user),
        )

    async def verify_email(self, token: str) -> None:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = UUID(payload["sub"])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
            raise InvalidTokenError()

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()

        user.email_verified = True
        await self.db.commit()

    async def get_current_user(self, token_str: str) -> User:
        user_id = verify_access_token(token_str)
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()
        return user

    async def authenticate_api_key(self, api_key: str) -> Project:
        from app.core.security import parse_api_key, verify_api_key

        key_id, secret = parse_api_key(api_key)
        result = await self.db.execute(
            select(Project).where(Project.api_key_id == key_id)
        )
        project = result.scalar_one_or_none()

        if project is None:
            raise InvalidAPIKeyError()

        if not verify_api_key(secret, project.api_key_hash):
            raise InvalidAPIKeyError()

        return project
