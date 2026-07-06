from typing import Any

from pydantic import BaseModel, field_validator


class UpdateMemoryRequest(BaseModel):
    content: str | None = None
    metadata: dict[str, Any] | None = None
    external_id: str | None = None
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        if v is None:
            raise ValueError("Content cannot be None.")
        
        value = v.strip()
        if not value:
            raise ValueError("Content cannot be empty or whitespace.")
        
        return value