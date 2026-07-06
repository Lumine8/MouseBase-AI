from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

class MemoryResponse(BaseModel):
    memory_id: UUID = Field(..., description="Unique identifier for the memory")
    external_id: str | None = Field(default=None, description="External identifier for the memory")
    content: str = Field(..., description="Content of the memory")
    metadata : dict[str, Any] = Field(default_factory=dict, description="Metadata associated with the memory")
    created_at : datetime
    updated_at : datetime

