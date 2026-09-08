from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage import Usage


class UsageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_or_create(self, project_id: UUID, usage_date: date) -> Usage:
        result = await self.db.execute(
            select(Usage).where(
                Usage.project_id == project_id,
                Usage.date == usage_date,
            )
        )
        usage = result.scalar_one_or_none()
        if usage is None:
            usage = Usage(project_id=project_id, date=usage_date)
            self.db.add(usage)
        return usage

    async def increment_requests(self, project_id: UUID, count: int = 1) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.requests = (usage.requests or 0) + count

    async def increment_searches(self, project_id: UUID, count: int = 1) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.searches = (usage.searches or 0) + count

    async def increment_embeddings(self, project_id: UUID, count: int = 1) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.embeddings = (usage.embeddings or 0) + count

    async def increment_storage(self, project_id: UUID, bytes_count: int) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.storage_bytes = (usage.storage_bytes or 0) + bytes_count

    async def get_monthly_searches(self, owner_id: UUID) -> int:
        today = date.today()
        month_start = today.replace(day=1)
        from app.models.project import Project

        result = await self.db.execute(
            select(func.coalesce(func.sum(Usage.searches), 0)).where(
                Usage.project_id.in_(
                    select(Project.id).where(Project.owner_id == owner_id)
                ),
                Usage.date >= month_start,
                Usage.date <= today,
            )
        )
        return result.scalar() or 0
