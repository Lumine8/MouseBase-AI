from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.exceptions.auth import InvalidAPIKeyError, InvalidTokenError
from app.models.project import Project
from app.models.user import User
from app.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise InvalidTokenError()
    auth_service = AuthService(db)
    token = credentials.credentials
    return await auth_service.get_current_user(token)


async def get_current_user_jwt_only(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """JWT-only authentication. Does NOT fall back to API key auth."""
    if credentials is None:
        raise InvalidTokenError()
    auth_service = AuthService(db)
    token = credentials.credentials
    return await auth_service.get_current_user(token)


async def get_current_project(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Project:
    if credentials is None:
        raise InvalidAPIKeyError()
    auth_service = AuthService(db)
    api_key = credentials.credentials
    return await auth_service.authenticate_api_key(api_key)


async def get_current_user_or_project(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Try JWT auth first, fall back to API key auth for dashboard backwards compat."""
    if credentials is None:
        raise InvalidTokenError()
    auth_service = AuthService(db)
    token = credentials.credentials

    is_jwt = token.startswith("eyJ")

    if is_jwt:
        try:
            from app.core.security import verify_access_token

            user_id = verify_access_token(token)
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user is not None:
                return user
        except Exception:
            pass
        raise InvalidTokenError()

    try:
        project = await auth_service.authenticate_api_key(token)
        result = await db.execute(select(User).where(User.id == project.owner_id))
        user = result.scalar_one_or_none()
        if user is not None:
            return user
    except Exception:
        pass

    raise InvalidAPIKeyError()
