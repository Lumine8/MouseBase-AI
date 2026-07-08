from __future__ import annotations

from datetime import date, timezone
from uuid import UUID

from sqlalchemy import select
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
        usage.requests += count

    async def increment_searches(self, project_id: UUID, count: int = 1) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.searches += count

    async def increment_embeddings(self, project_id: UUID, count: int = 1) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.embeddings += count

    async def increment_storage(
        self, project_id: UUID, bytes_count: int
    ) -> None:
        usage = await self._get_or_create(project_id, date.today())
        usage.storage_bytes += bytes_count
