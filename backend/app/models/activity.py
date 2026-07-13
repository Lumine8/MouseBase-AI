import uuid
from datetime import datetime, timezone
from typing import Any, Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    memory_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("memories.id", ondelete="SET NULL"), nullable=True
    )
    details: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    project: Mapped["Project"] = relationship()
