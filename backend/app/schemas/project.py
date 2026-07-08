from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty or whitespace")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ProjectUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty or whitespace")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="Unique identifier for the project")
    owner_id: UUID = Field(..., description="Unique identifier of the project owner")
    name: str = Field(..., description="Name of the project", examples=["My Project"])
    description: str | None = Field(
        default=None, description="Description of the project"
    )
    api_key_id: str = Field(..., description="Prefix identifier for the API key")
    plan: str = Field(default="free", description="Billing plan")
    status: str = Field(default="ACTIVE", description="Project status")
    created_at: datetime = Field(
        ..., description="Timestamp when the project was created"
    )
    updated_at: datetime = Field(
        ..., description="Timestamp when the project was last updated"
    )


class ProjectKeyResponse(ProjectResponse):
    api_key: str | None = Field(
        default=None, description="The full API key (only returned to the owner)"
    )


class ApiKeyResponse(BaseModel):
    project_id: UUID = Field(..., description="Unique identifier of the project")
    api_key: str = Field(..., description="The full API key")
