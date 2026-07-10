from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RememberResponse(BaseModel):
    memory_id: str
    created_at: datetime


class SearchResult(BaseModel):
    id: str
    external_id: str | None = None
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


class MemoryResponse(BaseModel):
    id: str
    external_id: str | None = None
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: str | None = None
    api_key_id: str
    plan: str = "free"
    status: str = "ACTIVE"
    created_at: datetime
    updated_at: datetime


class ProjectKeyResponse(ProjectResponse):
    api_key: str | None = None


class ApiKeyResponse(BaseModel):
    project_id: str
    api_key: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    token: str
    refresh_token: str
    user: UserResponse


class RefreshResponse(BaseModel):
    token: str
    refresh_token: str


class SessionResponse(BaseModel):
    id: str
    user_agent: str | None = None
    ip_address: str | None = None
    last_used_at: datetime
    created_at: datetime


class MessageResponse(BaseModel):
    message: str
