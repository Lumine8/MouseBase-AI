import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.memory import Memory
    from app.models.user import User

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID]  = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description:Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    api_key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    api_key_id: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc),
                                                    onupdate=lambda:datetime.now(timezone.utc))
    owner: Mapped["User"] = relationship(back_populates="projects")
    memories: Mapped[list["Memory"]] = relationship(back_populates="project", cascade="all, delete-orphan")