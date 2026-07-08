from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.memory import Memory
from app.models.project import Project
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
            select(func.count(Memory.id)).where(Memory.project_id.in_(project_ids))
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
        total_storage_bytes = row[3] or 0

    plan = project_list[0].plan if project_list else "free"

    return {
        "total_memories": total_memories,
        "total_searches": total_searches,
        "total_requests": total_requests,
        "total_embeddings": total_embeddings,
        "total_projects": len(project_list),
        "plan": plan,
    }
