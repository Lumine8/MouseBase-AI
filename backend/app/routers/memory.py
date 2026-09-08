from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_project
from app.models.project import Project
from app.models.version import MemoryVersion

from app.services.memory_service import MemoryService
from app.services.activity_service import ActivityService
from app.services.usage_service import UsageService
from app.services.rate_limiter import enforce_rate_limit
from app.core.plan_enforcer import get_effective_limits

from app.schemas.memory import MemoryResponse
from app.schemas.update import UpdateMemoryRequest
from app.services import create_embedding_service

from pydantic import BaseModel

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get(
    "/{memory_id}",
    response_model=MemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a memory by its ID.",
    description="Retrieves a single memory belonging to the authenticated project.",
)
async def get_memory(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> MemoryResponse:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    memory_service = MemoryService(db=db)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    return await memory_service.get_memory(memory_id, project)


@router.patch(
    "/{memory_id}",
    response_model=MemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a memory.",
    description="Updates one or more fields of a memory belonging to the authenticated project.",
)
async def update_memory(
    memory_id: UUID,
    request: UpdateMemoryRequest = Body(
        openapi_examples={
            "update_content": {
                "summary": "Update content",
                "description": "Update only the content of a memory.",
                "value": {
                    "content": "Updated memory content.",
                    "metadata": None,
                    "external_id": None,
                },
            },
            "update_metadata": {
                "summary": "Update metadata",
                "description": "Update only the metadata of a memory.",
                "value": {
                    "content": None,
                    "metadata": {"source": "updated", "priority": "high"},
                    "external_id": None,
                },
            },
        }
    ),
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> MemoryResponse:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    memory_service = MemoryService(
        db=db,
        embedding_service=create_embedding_service(),
    )

    result = await memory_service.update_memory(memory_id, project, request)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    if request.content is not None:
        await usage.increment_embeddings(project.id)
        await usage.increment_storage(project.id, len(request.content.encode("utf-8")))
    activity = ActivityService(db)
    changed = []
    if request.content is not None:
        changed.append("content")
    if request.metadata is not None:
        changed.append("metadata")
    if request.external_id is not None:
        changed.append("external_id")
    await activity.log(
        project_id=project.id,
        action="patch",
        memory_id=memory_id,
        details={"changed_fields": changed},
    )
    return result


@router.delete(
    "/{memory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a memory (soft-delete).",
    description="Soft-deletes a memory by setting its status to 'deleted'. It will no longer appear in search or list results.",
)
async def delete_memory(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> None:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    memory_service = MemoryService(db=db)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    await memory_service.delete_memory(memory_id, project)
    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="delete",
        memory_id=memory_id,
    )


@router.post(
    "/{memory_id}/archive",
    response_model=MemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Archive a memory.",
    description="Archives a memory. Archived memories are excluded from search results but can be restored.",
)
async def archive_memory(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> MemoryResponse:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    memory_service = MemoryService(db=db)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    result = await memory_service.archive_memory(memory_id, project)
    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="archive",
        memory_id=memory_id,
    )
    return result


@router.post(
    "/{memory_id}/restore",
    response_model=MemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Restore an archived memory.",
    description="Restores an archived memory back to active status.",
)
async def restore_memory(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> MemoryResponse:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    memory_service = MemoryService(db=db)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    result = await memory_service.restore_memory(memory_id, project)
    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="restore",
        memory_id=memory_id,
    )
    return result


class MemoryVersionResponse(BaseModel):
    id: str
    memory_id: str
    version: int
    content: str
    metadata: dict | None
    external_id: str | None
    importance: float
    source: str | None
    confidence: float | None
    created_at: str


@router.get(
    "/{memory_id}/versions",
    response_model=list[MemoryVersionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get version history of a memory.",
    description="Returns all saved versions of a memory, ordered by version number.",
)
async def get_memory_versions(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> list[MemoryVersionResponse]:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])

    # Verify memory exists and belongs to project
    from app.models.memory import Memory

    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.project_id == project.id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    usage = UsageService(db)
    await usage.increment_requests(project.id)

    versions_result = await db.execute(
        select(MemoryVersion)
        .where(MemoryVersion.memory_id == memory_id)
        .order_by(MemoryVersion.version.desc())
    )
    versions = versions_result.scalars().all()

    return [
        MemoryVersionResponse(
            id=str(v.id),
            memory_id=str(v.memory_id),
            version=v.version,
            content=v.content,
            metadata=v.metadata_,
            external_id=v.external_id,
            importance=v.importance,
            source=v.source,
            confidence=v.confidence,
            created_at=v.created_at.isoformat(),
        )
        for v in versions
    ]


@router.post(
    "/{memory_id}/restore/{version_id}",
    response_model=MemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Restore a memory to a specific version.",
    description="Reverts a memory's content and metadata to a previous version.",
)
async def restore_memory_version(
    memory_id: UUID,
    version_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> MemoryResponse:
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])

    # Verify memory exists and belongs to project
    from app.models.memory import Memory

    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.project_id == project.id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Get the version
    version_result = await db.execute(
        select(MemoryVersion).where(
            MemoryVersion.id == version_id,
            MemoryVersion.memory_id == memory_id,
        )
    )
    version = version_result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    usage = UsageService(db)
    await usage.increment_requests(project.id)

    # Record current state as a new version before restoring
    version_count_result = await db.execute(
        select(func.count(MemoryVersion.id)).where(MemoryVersion.memory_id == memory.id)
    )
    current_version = version_count_result.scalar() or 0

    pre_restore_version = MemoryVersion(
        memory_id=memory.id,
        version=current_version + 1,
        content=memory.content,
        metadata_=memory.metadata_,
        external_id=memory.external_id,
        importance=memory.importance,
        source=memory.source,
        confidence=memory.confidence,
        created_at=memory.created_at,
    )
    db.add(pre_restore_version)

    # Restore the memory to the version
    memory.content = version.content
    memory.metadata_ = version.metadata_
    memory.external_id = version.external_id
    memory.importance = version.importance
    memory.source = version.source
    memory.confidence = version.confidence

    # Update embedding if content changed
    if memory.content != version.content:
        from app.models.embedding import Embedding
        from app.core.config import settings

        embedding_stmt = select(Embedding).where(
            Embedding.memory_id == memory.id,
            Embedding.model == settings.EMBEDDING_MODEL,
        )
        embedding_result = await db.execute(embedding_stmt)
        embedding = embedding_result.scalar_one_or_none()
        if embedding:
            from app.services import create_embedding_service

            embedding_service = create_embedding_service()
            embedding.vector = await embedding_service.embed(version.content)

        # Update search_vector
        from sqlalchemy import text

        await db.execute(
            text(
                "UPDATE memories SET search_vector = to_tsvector('english', coalesce(:content, '')) WHERE id = :id"
            ),
            {"content": version.content, "id": str(memory.id)},
        )

    await db.commit()
    await db.refresh(memory)

    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="restore_version",
        memory_id=memory_id,
        details={"version_id": str(version_id), "version_number": version.version},
    )

    memory_service = MemoryService(db=db)
    return await memory_service._to_response(memory)
