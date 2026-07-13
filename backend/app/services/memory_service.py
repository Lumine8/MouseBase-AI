from datetime import date, datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.remember import RememberRequest
from app.services.embedding_service import EmbeddingService

from app.exceptions.memory import MemoryNotFoundError
from app.exceptions.update import EmptyUpdateError
from app.exceptions.embedding import EmbeddingServiceUnavailableError


from app.models.memory import Memory
from app.schemas.memory import MemoryResponse
from app.schemas.update import UpdateMemoryRequest
from app.schemas.explorer import (
    MemoryListItem, MemoryListResponse, MemoryStatsResponse,
)
from app.models.embedding import Embedding
from app.models.usage import Usage

from app.core.config import settings
from app.core.plan_enforcer import check_memory_limit
from app.exceptions.memory import MemoryLimitError
from app.exceptions.project import ProjectNotFoundError
from app.services import create_embedding_service

# from app.routers import memory


async def remember(
    project: Project,
    request: RememberRequest,
    db: AsyncSession,
) -> MemoryResponse:
    embedding_service = create_embedding_service()
    vector = await embedding_service.embed(request.content)

    memory = Memory(
        project=project,
        content=request.content,
        metadata_=request.metadata,
        external_id=request.external_id,
    )
    embedding = Embedding(
        memory=memory,
        model=settings.EMBEDDING_MODEL,
        dimensions=settings.EMBEDDING_DIMENSIONS,
        vector=vector,
    )
    db.add(memory)
    db.add(embedding)
    await db.commit()
    await db.refresh(memory)

    return MemoryResponse(
        id=memory.id,
        external_id=memory.external_id,
        content=memory.content,
        metadata=memory.metadata_,
        created_at=memory.created_at,
        updated_at=memory.updated_at,
        embedding_model=embedding.model,
        embedding_dimensions=embedding.dimensions,
    )


class MemoryService:
    def __init__(
        self, db: AsyncSession, embedding_service: EmbeddingService | None = None
    ):
        self.db = db
        self.embedding_service = embedding_service

    async def remember(
        self, project: Project, request: RememberRequest
    ) -> MemoryResponse:

        if self.embedding_service is None:
            raise RuntimeError("Embedding service is not initialized.")

        limited, msg = await check_memory_limit(self.db, project)
        if limited:
            raise MemoryLimitError(msg)

        vector = await self.embedding_service.embed(request.content)

        memory = Memory(
            project=project,
            content=request.content,
            metadata_=request.metadata,
            external_id=request.external_id,
        )

        embedding = Embedding(
            memory=memory,
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.EMBEDDING_DIMENSIONS,
            vector=vector,
        )

        self.db.add(memory)
        self.db.add(embedding)
        await self.db.commit()
        await self.db.refresh(memory)

        return await self._to_response(memory)

    async def _get_memory(self, memory_id: UUID, project: Project) -> Memory:
        stmt = select(Memory).where(
            Memory.id == memory_id, Memory.project_id == project.id
        )
        result = await self.db.execute(stmt)
        memory = result.scalar_one_or_none()

        if memory is None:
            raise MemoryNotFoundError()
        return memory

    async def _to_response(self, memory: Memory) -> MemoryResponse:
        emb_stmt = select(Embedding).where(Embedding.memory_id == memory.id)
        emb_result = await self.db.execute(emb_stmt)
        embedding = emb_result.scalar_one_or_none()

        return MemoryResponse(
            id=memory.id,
            external_id=memory.external_id,
            content=memory.content,
            metadata=memory.metadata_,
            created_at=memory.created_at,
            updated_at=memory.updated_at,
            embedding_model=embedding.model if embedding else None,
            embedding_dimensions=embedding.dimensions if embedding else None,
        )

    async def get_memory(self, memory_id: UUID, project: Project) -> MemoryResponse:

        memory = await self._get_memory(memory_id, project)
        return await self._to_response(memory)

    async def update_memory(
        self, memory_id: UUID, project: Project, request: UpdateMemoryRequest
    ) -> MemoryResponse:

        memory = await self._get_memory(memory_id, project)
        if (
            request.content is None
            and request.metadata is None
            and request.external_id is None
        ):
            raise EmptyUpdateError()

        if request.content is not None and request.content != memory.content:
            if self.embedding_service is None:
                raise EmbeddingServiceUnavailableError()

            embedding_stmt = select(Embedding).where(
                Embedding.memory_id == memory.id,
                Embedding.model == settings.EMBEDDING_MODEL,
            )

            embedding_result = await self.db.execute(embedding_stmt)
            embedding = embedding_result.scalar_one_or_none()
            if embedding is None:
                raise EmbeddingServiceUnavailableError()

            memory.content = request.content
            embedding.vector = await self.embedding_service.embed(request.content)

        if request.metadata is not None:
            memory.metadata_ = request.metadata

        if request.external_id is not None:
            memory.external_id = request.external_id

        await self.db.commit()
        await self.db.refresh(memory)

        return await self._to_response(memory)

    async def delete_memory(self, memory_id: UUID, project: Project) -> None:
        memory = await self._get_memory(memory_id, project)

        await self.db.delete(memory)
        await self.db.commit()

    async def list_memories(
        self,
        project: Project,
        page: int = 1,
        per_page: int = 50,
        external_id: str | None = None,
        metadata_filter: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        content_search: str | None = None,
        model: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> MemoryListResponse:
        base_query = select(Memory).where(Memory.project_id == project.id)

        if external_id:
            base_query = base_query.where(Memory.external_id == external_id)
        if content_search:
            base_query = base_query.where(
                Memory.content.ilike(f"%{content_search}%")
            )
        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                if dt_from.tzinfo is None:
                    dt_from = dt_from.replace(tzinfo=timezone.utc)
                base_query = base_query.where(Memory.created_at >= dt_from)
            except ValueError:
                pass
        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                if dt_to.tzinfo is None:
                    dt_to = dt_to.replace(tzinfo=timezone.utc)
                base_query = base_query.where(Memory.created_at <= dt_to)
            except ValueError:
                pass
        if metadata_filter and ":" in metadata_filter:
            key, value = metadata_filter.split(":", 1)
            base_query = base_query.where(
                Memory.metadata_[key].as_string() == value
            )

        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        total_pages = max(1, (total + per_page - 1) // per_page)
        page = max(1, min(page, total_pages))

        offset = (page - 1) * per_page

        sort_col = getattr(Memory, sort_by, Memory.created_at)
        order_fn = sort_col.desc if sort_order == "desc" else sort_col.asc
        base_query = base_query.order_by(order_fn())

        base_query = base_query.offset(offset).limit(per_page)

        result = await self.db.execute(base_query)
        memories = result.scalars().all()

        items = [
            MemoryListItem(
                id=m.id,
                external_id=m.external_id,
                content=m.content,
                metadata=m.metadata_ or {},
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
            for m in memories
        ]

        return MemoryListResponse(
            memories=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
        )

    async def get_memory_stats(self, project: Project) -> MemoryStatsResponse:
        mem_count = await self.db.execute(
            select(func.count(Memory.id)).where(Memory.project_id == project.id)
        )
        total = mem_count.scalar() or 0

        avg_length = await self.db.execute(
            select(func.avg(func.length(Memory.content))).where(
                Memory.project_id == project.id
            )
        )
        avg = round(avg_length.scalar() or 0, 1)

        today = date.today()
        created_today = await self.db.execute(
            select(func.count(Memory.id)).where(
                Memory.project_id == project.id,
                func.date(Memory.created_at) == today,
            )
        )
        created_today_count = created_today.scalar() or 0

        searches_today = await self.db.execute(
            select(func.coalesce(func.sum(Usage.searches), 0)).where(
                Usage.project_id == project.id,
                Usage.date == today,
            )
        )
        searches = searches_today.scalar() or 0

        storage = await self.db.execute(
            select(func.coalesce(func.sum(Usage.storage_bytes), 0)).where(
                Usage.project_id == project.id,
                Usage.date == today,
            )
        )
        storage_bytes = storage.scalar() or 0

        top_ext_ids = await self.db.execute(
            select(Memory.external_id, func.count(Memory.id).label("count"))
            .where(
                Memory.project_id == project.id,
                Memory.external_id.isnot(None),
            )
            .group_by(Memory.external_id)
            .order_by(func.count(Memory.id).desc())
            .limit(10)
        )
        top_ids = [
            {"external_id": row[0], "count": row[1]}
            for row in top_ext_ids
        ]

        top_meta = await self.db.execute(
            select(
                func.jsonb_object_keys(Memory.metadata_).label("key"),
                func.count(Memory.id).label("count"),
            )
            .where(
                Memory.project_id == project.id,
                Memory.metadata_.isnot(None),
            )
            .group_by(func.jsonb_object_keys(Memory.metadata_))
            .order_by(func.count(Memory.id).desc())
            .limit(10)
        )
        meta_keys = [{"key": row[0], "count": row[1]} for row in top_meta]

        return MemoryStatsResponse(
            total_memories=total,
            storage_bytes=storage_bytes,
            avg_memory_length=avg,
            top_external_ids=top_ids,
            top_metadata_keys=meta_keys,
            memories_created_today=created_today_count,
            searches_today=searches,
        )

    async def batch_delete_memories(
        self, memory_ids: list[UUID], project: Project
    ) -> int:
        stmt = select(Memory).where(
            Memory.id.in_(memory_ids),
            Memory.project_id == project.id,
        )
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        for m in memories:
            await self.db.delete(m)
        await self.db.commit()

        return len(memories)

    async def batch_export_memories(
        self, memory_ids: list[UUID], project: Project, fmt: str = "json"
    ) -> list[dict[str, Any]]:
        stmt = select(Memory).where(
            Memory.id.in_(memory_ids),
            Memory.project_id == project.id,
        )
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        rows = []
        for m in memories:
            emb_stmt = select(Embedding).where(Embedding.memory_id == m.id)
            emb_result = await self.db.execute(emb_stmt)
            emb = emb_result.scalar_one_or_none()

            row = {
                "id": str(m.id),
                "content": m.content,
                "external_id": m.external_id,
                "metadata": m.metadata_ or {},
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            }
            if emb:
                row["embedding_model"] = emb.model
                row["embedding_dimensions"] = emb.dimensions
            rows.append(row)

        return rows

    async def batch_move_memories(
        self,
        memory_ids: list[UUID],
        project: Project,
        target_project_id: UUID,
        user_id: UUID,
    ) -> int:
        target = await self.db.execute(
            select(Project).where(
                Project.id == target_project_id,
                Project.owner_id == user_id,
            )
        )
        target_project = target.scalar_one_or_none()
        if target_project is None:
            raise ProjectNotFoundError()

        stmt = select(Memory).where(
            Memory.id.in_(memory_ids),
            Memory.project_id == project.id,
        )
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        for m in memories:
            m.project_id = target_project_id
        await self.db.commit()

        return len(memories)

    async def batch_add_metadata(
        self,
        memory_ids: list[UUID],
        project: Project,
        metadata: dict[str, Any],
    ) -> int:
        stmt = select(Memory).where(
            Memory.id.in_(memory_ids),
            Memory.project_id == project.id,
        )
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        for m in memories:
            current = m.metadata_ or {}
            current.update(metadata)
            m.metadata_ = current
        await self.db.commit()

        return len(memories)
