from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryResponse(BaseModel):
    id: UUID = Field(..., description="Unique identifier for the memory")
    external_id: str | None = Field(
        default=None, description="External identifier for the memory"
    )
    content: str = Field(
        ...,
        description="Content of the memory",
        examples=["The user clicked on the settings page."],
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict, description="Metadata associated with the memory"
    )
    status: str = Field(
        default="active",
        description="Memory status: active, archived, or deleted",
    )
    expires_at: datetime | None = Field(
        default=None,
        description="When the memory expires and is automatically deleted. None means never.",
    )
    importance: float = Field(
        default=0.5,
        description="Importance weight for search ranking (0.0–1.0).",
    )
    source: str | None = Field(
        default=None,
        description="Provenance tag: api, import, enrichment, or conversation.",
    )
    confidence: float | None = Field(
        default=None,
        description="Confidence score (0.0–1.0). How certain the system is about this memory.",
    )
    supersedes_id: str | None = Field(
        default=None,
        description="UUID of the memory this one replaces (supersedes).",
    )
    created_at: datetime = Field(
        ..., description="Timestamp when the memory was created"
    )
    updated_at: datetime = Field(
        ..., description="Timestamp when the memory was last updated"
    )
    embedding_model: str | None = Field(
        default=None, description="Model used to generate the embedding"
    )
    embedding_dimensions: int | None = Field(
        default=None, description="Number of dimensions in the embedding vector"
    )
