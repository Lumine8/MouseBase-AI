from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from typing import Any


class SearchRequest(BaseModel):
    query: str = Field(..., 
                       min_length=1,
                       max_length=8000,
                       description="The search query to find relevant memories."
                       )
    top_k: int = Field(default=10,
                       ge=1,
                       le=100,
                       description="The maximum number of relevant memories to return."
                    )
    
    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Query cannot be empty or whitespace")
        
        return value
    
class SearchResult(BaseModel):
    memory_id: UUID = Field(..., description="The unique identifier of the memory.")
    external_id: str | None = Field(default=None, description="An optional external identifier for the memory.")    
    content: str = Field(..., description="The content of the memory.")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Optional developer-defined metadata associated with the memory.")
    score: float = Field(..., description="The similarity score between the query and the memory.") 

class SearchResponse(BaseModel):
    results: list[SearchResult] = Field(..., description="A list of relevant memories matching the search query.")  
