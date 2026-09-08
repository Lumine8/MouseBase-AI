from datetime import datetime
from typing import Any, Literal

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
    expires_at: datetime | None = Field(
        default=None,
        description="Optional expiration timestamp. Memory will be automatically deleted after this time.",
    )
    importance: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Importance weight for search ranking (0.0–1.0). Higher values rank memories higher in results.",
    )
    source: Literal["api", "import", "enrichment", "conversation"] | None = Field(
        default=None,
        description="Where this memory originated. Optional provenance tag.",
    )
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0–1.0). How certain the system is about this memory.",
    )
    supersedes_id: str | None = Field(
        default=None,
        description="UUID of the memory this one replaces (supersedes).",
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
