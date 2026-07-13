from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityLog


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        project_id: UUID,
        action: str,
        memory_id: UUID | None = None,
        details: dict[str, Any] | None = None,
    ) -> ActivityLog:
        entry = ActivityLog(
            project_id=project_id,
            action=action,
            memory_id=memory_id,
            details=details,
        )
        self.db.add(entry)
        await self.db.commit()
        return entry

    async def get_timeline(
        self,
        project_id: UUID,
        page: int = 1,
        per_page: int = 50,
    ) -> dict:
        base = (
            select(ActivityLog)
            .where(ActivityLog.project_id == project_id)
            .order_by(ActivityLog.created_at.desc())
        )

        count_q = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        total_pages = max(1, (total + per_page - 1) // per_page)
        page = max(1, min(page, total_pages))
        offset = (page - 1) * per_page

        result = await self.db.execute(base.offset(offset).limit(per_page))
        entries = result.scalars().all()

        return {
            "entries": [
                {
                    "id": str(e.id),
                    "action": e.action,
                    "memory_id": str(e.memory_id) if e.memory_id else None,
                    "details": e.details or {},
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
                for e in entries
            ],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }
