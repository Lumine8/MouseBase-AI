import uuid

# from datetime import datetime, timezone
# from typing import Optional
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, relationship, mapped_column

# from sqlalchemy.dialects.postgresql import JSONB

from pgvector.sqlalchemy import Vector

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.memory import Memory


class Embedding(Base):
    __tablename__ = "embeddings"
    __table_args__ = (
        UniqueConstraint("memory_id", "model", name="uq_embedding_memory_model"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id", ondelete="CASCADE"), nullable=False
    )
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    dimensions: Mapped[int] = mapped_column(nullable=False)
    vector: Mapped[list[float]] = mapped_column(Vector, nullable=False)
    memory: Mapped["Memory"] = relationship(
        back_populates="embeddings", lazy="selectin"
    )
