from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RefreshResponse,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
)
async def signup(
    request: SignupRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    service = AuthService(db)
    return await service.signup(request)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Sign in with email and password",
)
async def login(
    request: LoginRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    service = AuthService(db)
    return await service.login(request)


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Refresh access token",
)
async def refresh(
    request: RefreshRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> RefreshResponse:
    service = AuthService(db)
    return await service.refresh(request.refresh_token)


@router.post(
    "/verify-email",
    response_model=dict,
    summary="Verify email address",
)
async def verify_email(
    request: VerifyEmailRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.verify_email(request.token)
    return {"message": "Email verified successfully"}


@router.post(
    "/resend-verification",
    response_model=dict,
    summary="Resend verification email",
)
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.resend_verification(current_user.id)
    return {"message": "Verification email sent"}


@router.post(
    "/forgot-password",
    response_model=dict,
    summary="Send password reset email",
)
async def forgot_password(
    request: ForgotPasswordRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.forgot_password(request)
    return {"message": "If that email exists, a reset link has been sent"}


@router.post(
    "/reset-password",
    response_model=dict,
    summary="Reset password with token",
)
async def reset_password(
    request: ResetPasswordRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.reset_password(request)
    return {"message": "Password reset successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get(
    "/sessions",
    response_model=list[SessionResponse],
    summary="List active sessions",
)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SessionResponse]:
    service = AuthService(db)
    return await service.list_sessions(current_user.id)


@router.delete(
    "/sessions/{session_id}",
    response_model=dict,
    summary="Revoke a specific session",
)
async def revoke_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.revoke_session(current_user.id, session_id)
    return {"message": "Session revoked"}


@router.delete(
    "/sessions",
    response_model=dict,
    summary="Revoke all sessions (sign out everywhere)",
)
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = AuthService(db)
    await service.revoke_all_sessions(current_user.id)
    return {"message": "All sessions revoked"}
