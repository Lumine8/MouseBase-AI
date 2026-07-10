from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_token,
    create_password_reset_token,
    create_refresh_token,
    hash_token,
    verify_access_token,
    verify_email_token,
    verify_password_reset_token,
)
from app.exceptions.auth import (
    EmailAlreadyExistsError,
    InvalidAPIKeyError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.models.project import Project
from app.models.session import RefreshToken, Session
from app.models.user import User
from app.models.subscription import PlanType
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshResponse,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    UserResponse,
)
from app.services.email_service import get_email_sender
from app.services.subscription_service import create_subscription

password_hash = PasswordHash.recommended()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.mailer = get_email_sender()

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

        if settings.ENVIRONMENT == "development":
            user.email_verified = True
        else:
            await self._send_verification_email(user)

        await create_subscription(self.db, user.id, PlanType.FREE)
        await self.db.flush()

        refresh_token_str = create_refresh_token()
        await self._store_refresh_token(user.id, refresh_token_str)

        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token(user.id)
        return AuthResponse(
            token=token,
            refresh_token=refresh_token_str,
            user=UserResponse.model_validate(user),
        )

    async def login(self, request: LoginRequest) -> AuthResponse:
        result = await self.db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()

        if user is None or not password_hash.verify(
            request.password, user.password_hash
        ):
            raise InvalidCredentialsError()

        user.last_login = datetime.now(timezone.utc)

        refresh_token_str = create_refresh_token()
        await self._store_refresh_token(user.id, refresh_token_str)

        await self.db.commit()

        token = create_access_token(user.id)
        return AuthResponse(
            token=token,
            refresh_token=refresh_token_str,
            user=UserResponse.model_validate(user),
        )

    async def refresh(self, refresh_token_str: str) -> RefreshResponse:
        token_hash = hash_token(refresh_token_str)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        token = result.scalar_one_or_none()
        if token is None:
            raise InvalidTokenError()

        token.revoked = True

        new_refresh = create_refresh_token()
        await self._store_refresh_token(token.user_id, new_refresh)

        await self.db.commit()

        return RefreshResponse(
            token=create_access_token(token.user_id),
            refresh_token=new_refresh,
        )

    async def verify_email(self, token: str) -> None:
        user_id = verify_email_token(token)
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()
        if user.email_verified:
            return
        user.email_verified = True
        await self.db.commit()

    async def resend_verification(self, user_id: UUID) -> None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()
        if user.email_verified:
            return
        await self._send_verification_email(user)

    async def forgot_password(self, request: ForgotPasswordRequest) -> None:
        result = await self.db.execute(select(User).where(User.email == request.email))
        user = result.scalar_one_or_none()
        if user is None:
            return

        token = create_password_reset_token(user.id)
        self.mailer.send(
            to=user.email,
            subject="Password Reset — MouseBase",
            body=f"Reset your password using this link:\n\n"
            f"{settings.FRONTEND_URL}/reset-password?token={token}\n\n"
            f"This link expires in 1 hour.",
        )

    async def reset_password(self, request: ResetPasswordRequest) -> None:
        user_id = verify_password_reset_token(request.token)
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise InvalidTokenError()

        user.password_hash = password_hash.hash(request.password)
        await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
            )
        )
        await self.db.commit()

    async def list_sessions(self, user_id: UUID) -> list[SessionResponse]:
        result = await self.db.execute(
            select(Session)
            .where(Session.user_id == user_id)
            .order_by(Session.last_used_at.desc())
        )
        sessions = result.scalars().all()
        return [SessionResponse.model_validate(s) for s in sessions]

    async def revoke_session(self, user_id: UUID, session_id: UUID) -> None:
        result = await self.db.execute(
            select(Session).where(Session.id == session_id, Session.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if session is None:
            return

        await self.db.execute(
            select(RefreshToken).where(RefreshToken.id == session.refresh_token_id)
        )

        await self.db.delete(session)
        await self.db.commit()

    async def revoke_all_sessions(self, user_id: UUID) -> None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
            )
        )
        tokens = result.scalars().all()
        for t in tokens:
            t.revoked = True

        result = await self.db.execute(
            select(Session).where(Session.user_id == user_id)
        )
        sessions = result.scalars().all()
        for s in sessions:
            await self.db.delete(s)

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

    async def _send_verification_email(self, user: User) -> None:
        token = create_email_token(user.id)
        self.mailer.send(
            to=user.email,
            subject="Verify your email — MouseBase",
            body=f"Welcome to MouseBase!\n\n"
            f"Verify your email using this link:\n\n"
            f"{settings.FRONTEND_URL}/verify-email?token={token}\n\n"
            f"This link expires in 24 hours.",
        )

    async def _store_refresh_token(self, user_id: UUID, refresh_token_str: str) -> None:
        token_hash = hash_token(refresh_token_str)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_EXPIRY_DAYS
        )
        refresh = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(refresh)
        await self.db.flush()
