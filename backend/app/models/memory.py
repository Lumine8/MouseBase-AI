import uuid
from datetime import datetime, timezone
from typing import Optional, Any, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.embedding import Embedding
    from app.models.project import Project


class Memory(Base):
    __tablename__ = "memories"
    __table_args__ = (
        Index("ix_memories_search_vector", "search_vector", postgresql_using="gin"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    search_vector: Mapped[Optional[Any]] = mapped_column(TSVECTOR, nullable=True)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata", JSONB, nullable=True, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    project: Mapped["Project"] = relationship(back_populates="memories")
    embeddings: Mapped[list["Embedding"]] = relationship(
        back_populates="memory", cascade="all, delete-orphan", lazy="selectin"
    )
