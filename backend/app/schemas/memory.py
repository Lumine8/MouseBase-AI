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
