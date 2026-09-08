from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from typing import Any, Union
from datetime import datetime


class MetadataFilter(BaseModel):
    """Advanced metadata filter supporting exact match, range queries, and IN lists.

    Exact match: {"key": "value"}
    Range queries: {"key": {"$gt": 25}}, {"key": {"$lt": 100}}, {"key": {"$gte": 25}}, {"key": {"$lte": 100}}
    IN lists: {"key": {"$in": ["a", "b", "c"]}}
    Nested keys: {"user.name": "John"}
    """

    pass


class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="The search query to find relevant memories.",
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=100,
        description="The maximum number of relevant memories to return.",
    )
    metadata_filters: dict[str, Any] | None = Field(
        default=None,
        description="""Filter results by metadata. Supports:
- Exact match: {"key": "value"}
- GT/LT: {"key": {"$gt": 25}}, {"key": {"$lt": 100}}
- GTE/LTE: {"key": {"$gte": 25}}, {"key": {"$lte": 100}}
- IN: {"key": {"$in": ["a", "b"]}}
- Nested: {"user.name": "John"}
""",
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Query cannot be empty or whitespace")

        return value


class SearchResult(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the memory.")
    external_id: str | None = Field(
        default=None, description="An optional external identifier for the memory."
    )
    content: str = Field(
        ...,
        description="The content of the memory.",
        examples=["The user clicked on the settings page."],
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional developer-defined metadata associated with the memory.",
    )
    score: float = Field(
        ...,
        description="The similarity score between the query and the memory.",
        examples=[0.89],
    )
    created_at: datetime | None = Field(
        default=None,
        description="When the memory was created. Used for tie-breaking.",
    )


class SearchResponse(BaseModel):
    results: list[SearchResult] = Field(
        ..., description="A list of relevant memories matching the search query."
    )
