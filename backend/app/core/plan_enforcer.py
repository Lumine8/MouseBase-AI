from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limits import PLAN_LIMITS
from app.models.subscription import Subscription, PlanType
from app.models.memory import Memory
from app.models.project import Project


async def get_subscription_for_project(
    db: AsyncSession, project: Project
) -> Optional[Subscription]:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == project.owner_id)
    )
    return result.scalar_one_or_none()


async def check_memory_limit(
    db: AsyncSession,
    project: Project,
) -> tuple[bool, str]:
    sub = await get_subscription_for_project(db, project)
    if sub is None:
        return False, "No subscription found for project owner"
    plan_limits = PLAN_LIMITS.get(sub.plan, PLAN_LIMITS[PlanType.FREE])
    max_memories = max(sub.max_memories, plan_limits["max_memories"])
    count_result = await db.execute(
        select(func.count(Memory.id)).where(
            Memory.project_id.in_(
                select(Project.id).where(Project.owner_id == project.owner_id)
            )
        )
    )
    total = count_result.scalar() or 0
    if total >= max_memories:
        return True, f"Memory limit reached ({max_memories})"
    return False, ""


async def check_project_limit(
    db: AsyncSession,
    owner_id: UUID,
) -> tuple[bool, str]:
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == owner_id)
    )
    sub = sub_result.scalar_one_or_none()
    if sub is None:
        return False, "No subscription found"
    plan_limits = PLAN_LIMITS.get(sub.plan, PLAN_LIMITS[PlanType.FREE])
    max_projects = max(sub.max_projects, plan_limits["max_projects"])
    count_result = await db.execute(
        select(func.count(Project.id)).where(Project.owner_id == owner_id)
    )
    total = count_result.scalar() or 0
    if total >= max_projects:
        return True, f"Project limit reached ({max_projects})"
    return False, ""


async def get_effective_limits(db: AsyncSession, owner_id: UUID) -> dict:
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == owner_id)
    )
    sub = sub_result.scalar_one_or_none()
    plan = sub.plan if sub else PlanType.FREE
    plan_limits = PLAN_LIMITS.get(plan, PLAN_LIMITS[PlanType.FREE])
    return {
        "max_memories": (
            max(sub.max_memories, plan_limits["max_memories"])
            if sub
            else plan_limits["max_memories"]
        ),
        "max_searches_per_month": (
            max(sub.max_searches_per_month, plan_limits["max_searches_per_month"])
            if sub
            else plan_limits["max_searches_per_month"]
        ),
        "max_projects": (
            max(sub.max_projects, plan_limits["max_projects"])
            if sub
            else plan_limits["max_projects"]
        ),
        "requests_per_hour": (
            max(sub.requests_per_hour, plan_limits["requests_per_hour"])
            if sub
            else plan_limits["requests_per_hour"]
        ),
        "plan": plan.value,
    }
