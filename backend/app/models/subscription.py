import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from enum import Enum as PyEnum

from sqlalchemy import Enum, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.payment import Payment


class PlanType(str, PyEnum):
    FREE = "FREE"
    DEVELOPER = "DEVELOPER"
    PRO = "PRO"
    TEAM_5 = "TEAM_5"
    TEAM_10 = "TEAM_10"
    ENTERPRISE = "ENTERPRISE"


class SubscriptionStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    plan: Mapped[PlanType] = mapped_column(
        Enum(PlanType, create_constraint=False),
        nullable=False, default=PlanType.FREE
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, create_constraint=False),
        nullable=False, default=SubscriptionStatus.ACTIVE
    )
    renewal_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    razorpay_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    max_projects: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_memories: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    max_searches_per_month: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    requests_per_hour: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    user: Mapped["User"] = relationship(back_populates="subscription")
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan"
    )
