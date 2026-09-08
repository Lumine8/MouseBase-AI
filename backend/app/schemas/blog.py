from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class BlogPostCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    excerpt: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    tags: str = Field(default="", max_length=500)
    published: bool = Field(default=False)


class BlogPostUpdate(BaseModel):
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    excerpt: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[str] = Field(None, max_length=500)
    published: Optional[bool] = None


class BlogPostResponse(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    content: str
    tags: str
    published: bool
    author_id: str
    created_at: datetime
    updated_at: datetime


class BlogPostListItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    tags: str
    published: bool
    created_at: datetime
    updated_at: datetime
