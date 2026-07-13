from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryListItem(BaseModel):
    id: UUID = Field(..., description="Unique identifier for the memory")
    external_id: str | None = Field(default=None)
    content: str = Field(...)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(...)
    updated_at: datetime = Field(...)

    model_config = {"from_attributes": True}


class MemoryListResponse(BaseModel):
    memories: list[MemoryListItem] = Field(...)
    total: int = Field(...)
    page: int = Field(...)
    per_page: int = Field(...)
    total_pages: int = Field(...)


class MemoryStatsResponse(BaseModel):
    total_memories: int = Field(...)
    storage_bytes: int = Field(default=0)
    avg_memory_length: float = Field(default=0)
    top_external_ids: list[dict] = Field(default_factory=list)
    top_metadata_keys: list[dict] = Field(default_factory=list)
    memories_created_today: int = Field(default=0)
    searches_today: int = Field(default=0)


class BatchDeleteRequest(BaseModel):
    memory_ids: list[UUID] = Field(..., min_length=1)


class BatchExportRequest(BaseModel):
    memory_ids: list[UUID] = Field(..., min_length=1)
    format: str = Field(default="json", pattern="^(json|csv|ndjson)$")


class BatchMoveRequest(BaseModel):
    memory_ids: list[UUID] = Field(..., min_length=1)
    target_project_id: UUID = Field(...)


class BatchAddMetadataRequest(BaseModel):
    memory_ids: list[UUID] = Field(..., min_length=1)
    metadata: dict[str, Any] = Field(...)
