from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import (
    get_current_user_or_project as get_current_user,
)
from app.models.user import User
from app.services.memory_service import MemoryService
from app.services.project_service import ProjectService
from app.services.activity_service import ActivityService
from app.schemas.explorer import (
    MemoryListResponse,
    MemoryStatsResponse,
    BatchDeleteRequest,
    BatchExportRequest,
    BatchMoveRequest,
    BatchAddMetadataRequest,
)

router = APIRouter(prefix="/projects/{project_id}/memories", tags=["explorer"])


@router.get(
    "/",
    response_model=MemoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List memories",
    description="Lists all memories for a project with pagination and filtering.",
)
async def list_memories(
    project_id: UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    external_id: str | None = Query(default=None),
    metadata_filter: str | None = Query(default=None, alias="metadata"),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    content: str | None = Query(default=None),
    model: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemoryListResponse:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    return await memory_service.list_memories(
        project=project,
        page=page,
        per_page=per_page,
        external_id=external_id,
        metadata_filter=metadata_filter,
        date_from=date_from,
        date_to=date_to,
        content_search=content,
        model=model,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/stats",
    response_model=MemoryStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Memory stats",
    description="Returns aggregate statistics for memories in a project.",
)
async def memory_stats(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemoryStatsResponse:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    return await memory_service.get_memory_stats(project)


@router.get(
    "/timeline",
    status_code=status.HTTP_200_OK,
    summary="Activity timeline",
    description="Returns a paginated timeline of activity events for a project.",
)
async def memory_timeline(
    project_id: UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_service = ProjectService(db)
    await project_service._get_owned_project(current_user.id, project_id)

    activity = ActivityService(db)
    return await activity.get_timeline(project_id, page, per_page)


@router.post(
    "/batch-delete",
    status_code=status.HTTP_200_OK,
    summary="Batch delete memories",
    description="Deletes multiple memories by their IDs.",
)
async def batch_delete(
    project_id: UUID,
    request: BatchDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    deleted = await memory_service.batch_delete_memories(request.memory_ids, project)

    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="batch_delete",
        details={"count": deleted},
    )

    return {"deleted": deleted}


@router.post(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export memories",
    description="Exports selected memories as JSON, CSV, or NDJSON.",
)
async def export_memories(
    project_id: UUID,
    request: BatchExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    rows = await memory_service.batch_export_memories(
        request.memory_ids, project, request.format
    )
    return {"memories": rows, "format": request.format, "count": len(rows)}


@router.post(
    "/move",
    status_code=status.HTTP_200_OK,
    summary="Move memories",
    description="Moves selected memories to another project owned by the same user.",
)
async def move_memories(
    project_id: UUID,
    request: BatchMoveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    moved = await memory_service.batch_move_memories(
        request.memory_ids,
        project,
        request.target_project_id,
        current_user.id,
    )
    return {"moved": moved}


@router.post(
    "/batch-add-metadata",
    status_code=status.HTTP_200_OK,
    summary="Batch add metadata",
    description="Adds metadata fields to multiple memories.",
)
async def batch_add_metadata(
    project_id: UUID,
    request: BatchAddMetadataRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_service = ProjectService(db)
    project = await project_service._get_owned_project(current_user.id, project_id)

    memory_service = MemoryService(db=db)
    updated = await memory_service.batch_add_metadata(
        request.memory_ids, project, request.metadata
    )

    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="batch_add_metadata",
        details={"count": updated, "keys": list(request.metadata.keys())},
    )

    return {"updated": updated}
