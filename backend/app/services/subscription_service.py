import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limits import PLAN_LIMITS, ADDON_PRICING
from app.models.subscription import Subscription, PlanType, SubscriptionStatus
from app.models.payment import Payment
from app.models.project import Project
from app.schemas.payment import (
    PlanInfo,
    PaymentHistory,
    BillingHistory,
)

PLAN_ORDER = [
    PlanType.FREE,
    PlanType.DEVELOPER,
    PlanType.PRO,
    PlanType.ENTERPRISE,
]


def _get_default_limits(plan: PlanType) -> dict:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS[PlanType.FREE])


async def create_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
    plan: PlanType = PlanType.FREE,
) -> Subscription:
    limits = _get_default_limits(plan)
    sub = Subscription(
        user_id=user_id,
        plan=plan,
        status=SubscriptionStatus.ACTIVE,
        max_projects=limits["max_projects"],
        max_memories=limits["max_memories"],
        max_searches_per_month=limits["max_searches_per_month"],
        requests_per_hour=limits["requests_per_hour"],
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def get_subscription(
    db: AsyncSession, user_id: uuid.UUID
) -> Optional[Subscription]:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upgrade_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
    new_plan: PlanType,
    razorpay_payment_id: str,
    razorpay_order_id: str,
) -> Subscription:
    sub = await get_subscription(db, user_id)
    if not sub:
        raise ValueError("No subscription found for user")
    limits = _get_default_limits(new_plan)
    sub.plan = new_plan
    sub.status = SubscriptionStatus.ACTIVE
    sub.cancel_at_period_end = False
    sub.renewal_date = datetime.now(timezone.utc) + timedelta(days=30)
    sub.max_projects = limits["max_projects"]
    sub.max_memories = limits["max_memories"]
    sub.max_searches_per_month = limits["max_searches_per_month"]
    sub.requests_per_hour = limits["requests_per_hour"]
    projects_result = await db.execute(
        select(Project).where(Project.owner_id == user_id)
    )
    for project in projects_result.scalars().all():
        project.plan = new_plan.value.lower()
    payment_record = Payment(
        subscription_id=sub.id,
        amount=limits["price"],
        currency="USD",
        status="captured",
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
    )
    db.add(payment_record)
    return sub


async def cancel_subscription(db: AsyncSession, user_id: uuid.UUID) -> Subscription:
    sub = await get_subscription(db, user_id)
    if not sub:
        raise ValueError("No subscription found for user")
    if sub.status == SubscriptionStatus.CANCELED:
        raise ValueError("Subscription is already canceled")
    sub.status = SubscriptionStatus.CANCELED
    sub.cancel_at_period_end = True
    free_limits = _get_default_limits(PlanType.FREE)
    sub.plan = PlanType.FREE
    sub.max_projects = free_limits["max_projects"]
    sub.max_memories = free_limits["max_memories"]
    sub.max_searches_per_month = free_limits["max_searches_per_month"]
    sub.requests_per_hour = free_limits["requests_per_hour"]
    projects_result = await db.execute(
        select(Project).where(Project.owner_id == user_id)
    )
    for project in projects_result.scalars().all():
        project.plan = "free"
    return sub


async def get_billing_history(db: AsyncSession, user_id: uuid.UUID) -> BillingHistory:
    sub = await get_subscription(db, user_id)
    if not sub:
        return BillingHistory(payments=[])
    result = await db.execute(
        select(Payment)
        .where(Payment.subscription_id == sub.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return BillingHistory(
        payments=[
            PaymentHistory(
                id=p.id,
                amount=p.amount,
                currency=p.currency,
                status=p.status,
                created_at=p.created_at,
                razorpay_payment_id=p.razorpay_payment_id,
                invoice_id=p.invoice_id,
            )
            for p in payments
        ]
    )


def get_available_plans() -> list[PlanInfo]:
    return [
        PlanInfo(
            id=plan.value,
            name=info["name"],
            price=info["price"],
            max_projects=info["max_projects"],
            max_memories=info["max_memories"],
            max_searches_per_month=info["max_searches_per_month"],
            requests_per_hour=info["requests_per_hour"],
            description=info["description"],
        )
        for plan, info in PLAN_LIMITS.items()
    ]


async def add_addon(
    db: AsyncSession,
    user_id: uuid.UUID,
    addon_type: str,
    quantity: int,
    razorpay_payment_id: str,
    razorpay_order_id: str,
) -> Subscription:
    sub = await get_subscription(db, user_id)
    if not sub:
        raise ValueError("No subscription found for user")
    addon_info = ADDON_PRICING.get(addon_type)
    if not addon_info:
        raise ValueError(f"Invalid addon type: {addon_type}")
    if addon_type == "additional_memory_1k":
        sub.max_memories += 1000 * quantity
    elif addon_type == "additional_searches_1k":
        sub.max_searches_per_month += 1000 * quantity
    elif addon_type == "additional_project":
        sub.max_projects += 1 * quantity
    payment_record = Payment(
        subscription_id=sub.id,
        amount=addon_info["price"] * quantity,
        currency="USD",
        status="captured",
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
    )
    db.add(payment_record)
    return sub


async def cancel_addon(
    db: AsyncSession,
    user_id: uuid.UUID,
    addon_type: str,
    quantity: int = 1,
) -> Subscription:
    sub = await get_subscription(db, user_id)
    if not sub:
        raise ValueError("No subscription found for user")
    if addon_type not in ADDON_PRICING:
        raise ValueError(f"Invalid addon type: {addon_type}")
    if addon_type == "additional_memory_1k":
        base = PLAN_LIMITS[sub.plan]["max_memories"]
        if sub.max_memories - (1000 * quantity) < base:
            raise ValueError(f"Cannot remove addon below base plan limit of {base}")
        sub.max_memories -= 1000 * quantity
    elif addon_type == "additional_searches_1k":
        base = PLAN_LIMITS[sub.plan]["max_searches_per_month"]
        if sub.max_searches_per_month - (1000 * quantity) < base:
            raise ValueError(f"Cannot remove addon below base plan limit of {base}")
        sub.max_searches_per_month -= 1000 * quantity
    elif addon_type == "additional_project":
        base = PLAN_LIMITS[sub.plan]["max_projects"]
        if sub.max_projects - quantity < base:
            raise ValueError(f"Cannot remove addon below base plan limit of {base}")
        sub.max_projects -= quantity
    return sub


def get_addon_info(addon_type: str) -> dict | None:
    return ADDON_PRICING.get(addon_type)
