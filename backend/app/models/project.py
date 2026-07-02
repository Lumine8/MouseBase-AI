import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID]  = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description:Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    api_key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc),
                                                    onupdate=lambda:datetime.now(timezone.utc))