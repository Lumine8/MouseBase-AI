from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel, Field, field_validator


class RememberRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="The text to store in MouseBase.",
    )
    external_id: str | None = Field(
        default=None, description="An optional external identifier for the memory."
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional developer-defined metadata to associate with the memory.",
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Content cannot be empty or whitespace")

        return value

    @field_validator("external_id")
    @classmethod
    def validate_external_id(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None


class RememberResponse(BaseModel):
    id: UUID = Field(
        ..., description="The unique identifier for the stored memory."
    )
    created_at: datetime = Field(
        ..., description="The timestamp when the memory was created."
    )
