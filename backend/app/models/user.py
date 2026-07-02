from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from datetime import datetime, timezone
import uuid

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID]  = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 nullable = False, 
                                                 default=lambda:datetime.now(timezone.utc), 
                                                 onupdate=lambda:datetime.now(timezone.utc))