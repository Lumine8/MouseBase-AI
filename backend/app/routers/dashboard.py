from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, literal
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user_or_project as get_current_user
from app.models.memory import Memory, MemoryStatus
from app.models.project import Project
from app.models.subscription import Subscription
from app.models.usage import Usage
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    projects = await db.execute(
        select(Project).where(Project.owner_id == current_user.id)
    )
    project_list = projects.scalars().all()
    project_ids = [p.id for p in project_list]

    total_memories = 0
    total_searches = 0
    total_requests = 0
    total_embeddings = 0

    if project_ids:
        mem_count = await db.execute(
            select(func.count(Memory.id)).where(
                Memory.project_id.in_(project_ids),
                Memory.status != MemoryStatus.DELETED.value,
            )
        )
        total_memories = mem_count.scalar() or 0

        today = date.today()
        usage_rows = await db.execute(
            select(
                func.coalesce(func.sum(Usage.searches), 0),
                func.coalesce(func.sum(Usage.requests), 0),
                func.coalesce(func.sum(Usage.embeddings), 0),
                func.coalesce(func.sum(Usage.storage_bytes), 0),
            ).where(
                Usage.project_id.in_(project_ids),
                Usage.date == today,
            )
        )
        row = usage_rows.one()
        total_searches = row[0] or 0
        total_requests = row[1] or 0
        total_embeddings = row[2] or 0

    plan = project_list[0].plan if project_list else "free"

    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = sub_result.scalar_one_or_none()
    if subscription:
        plan = subscription.plan.value.lower()

    return {
        "total_memories": total_memories,
        "total_searches": total_searches,
        "total_requests": total_requests,
        "total_embeddings": total_embeddings,
        "total_projects": len(project_list),
        "plan": plan,
    }


@router.get("/analytics")
async def dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    projects = await db.execute(
        select(Project).where(Project.owner_id == current_user.id)
    )
    project_list = projects.scalars().all()
    project_ids = [p.id for p in project_list]

    today = date.today()
    days = 7

    daily_usage = []
    if project_ids:
        start_date = today - timedelta(days=days - 1)
        rows = await db.execute(
            select(
                Usage.date,
                func.coalesce(func.sum(Usage.requests), 0),
                func.coalesce(func.sum(Usage.searches), 0),
                func.coalesce(func.sum(Usage.embeddings), 0),
                func.coalesce(func.sum(Usage.storage_bytes), 0),
            )
            .where(
                Usage.project_id.in_(project_ids),
                Usage.date >= start_date,
                Usage.date <= today,
            )
            .group_by(Usage.date)
            .order_by(Usage.date)
        )
        usage_by_date = {r[0]: r for r in rows.all()}

        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            day_label = d.strftime("%a")
            r = usage_by_date.get(d)
            daily_usage.append(
                {
                    "day": day_label,
                    "requests": r[1] if r else 0,
                    "searches": r[2] if r else 0,
                    "embeddings": r[3] if r else 0,
                    "storage_bytes": r[4] if r else 0,
                }
            )
    else:
        for i in range(days - 1, -1, -1):
            d = today - timedelta(days=i)
            daily_usage.append(
                {
                    "day": d.strftime("%a"),
                    "requests": 0,
                    "searches": 0,
                    "embeddings": 0,
                    "storage_bytes": 0,
                }
            )

    total = await db.execute(
        select(
            func.coalesce(func.sum(Usage.requests), 0),
            func.coalesce(func.sum(Usage.searches), 0),
            func.coalesce(func.sum(Usage.embeddings), 0),
        ).where(
            Usage.project_id.in_(project_ids) if project_ids else literal(False),
        )
    )
    t = total.one()
    requests_total = t[0] or 0
    searches_total = t[1] or 0
    embeddings_total = t[2] or 0

    mem_count = await db.execute(
        select(func.count(Memory.id)).where(
            Memory.project_id.in_(project_ids) if project_ids else literal(False),
            Memory.status != MemoryStatus.DELETED.value,
        )
    )
    total_memories = mem_count.scalar() or 0

    storage = await db.execute(
        select(func.coalesce(func.sum(Usage.storage_bytes), 0)).where(
            Usage.project_id.in_(project_ids) if project_ids else literal(False),
        )
    )
    total_storage_bytes = storage.scalar() or 0

    return {
        "daily": daily_usage,
        "totals": {
            "requests": requests_total,
            "searches": searches_total,
            "embeddings": embeddings_total,
            "memories": total_memories,
            "storage_bytes": total_storage_bytes,
        },
    }


@router.get("/billing-usage")
async def billing_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    projects = await db.execute(
        select(Project).where(Project.owner_id == current_user.id)
    )
    project_list = projects.scalars().all()
    project_ids = [p.id for p in project_list]

    today = date.today()
    month_start = today.replace(day=1)

    mem_count = await db.execute(
        select(func.count(Memory.id)).where(
            Memory.project_id.in_(project_ids) if project_ids else literal(False),
            Memory.status != MemoryStatus.DELETED.value,
        )
    )
    total_memories = mem_count.scalar() or 0

    monthly = await db.execute(
        select(
            func.coalesce(func.sum(Usage.requests), 0),
            func.coalesce(func.sum(Usage.searches), 0),
            func.coalesce(func.sum(Usage.embeddings), 0),
            func.coalesce(func.sum(Usage.storage_bytes), 0),
        ).where(
            Usage.project_id.in_(project_ids) if project_ids else literal(False),
            Usage.date >= month_start,
            Usage.date <= today,
        )
    )
    m = monthly.one()

    sub = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = sub.scalar_one_or_none()

    plan_limits = None
    if subscription:
        plan_limits = {
            "max_memories": subscription.max_memories,
            "max_searches_per_month": subscription.max_searches_per_month,
            "max_projects": subscription.max_projects,
            "requests_per_hour": subscription.requests_per_hour,
        }
    else:
        from app.core.limits import PLAN_LIMITS
        from app.models.subscription import PlanType

        default = PLAN_LIMITS[PlanType.FREE]
        plan_limits = {
            "max_memories": default["max_memories"],
            "max_searches_per_month": default["max_searches_per_month"],
            "max_projects": default["max_projects"],
            "requests_per_hour": default["requests_per_hour"],
        }

    return {
        "monthly_requests": m[0] or 0,
        "monthly_searches": m[1] or 0,
        "monthly_embeddings": m[2] or 0,
        "total_storage_bytes": m[3] or 0,
        "total_memories": total_memories,
        "total_projects": len(project_list),
        "plan_limits": plan_limits,
    }
