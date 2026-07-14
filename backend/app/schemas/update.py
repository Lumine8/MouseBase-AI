from typing import Any

from pydantic import BaseModel, Field, field_validator


class UpdateMemoryRequest(BaseModel):
    content: str | None = Field(
        default=None,
        min_length=1,
        max_length=8000,
        description="The new text content for the memory.",
    )
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="The new developer-defined metadata for the memory.",
    )
    external_id: str | None = Field(
        default=None,
        description="The new external identifier for the memory.",
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        if v is None:
            return v

        value = v.strip()
        if not value:
            raise ValueError("Content cannot be empty or whitespace.")

        return value
