from uuid import UUID

from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_project
from app.models.project import Project

from app.services.memory_service import MemoryService
from app.services.activity_service import ActivityService

from app.schemas.memory import MemoryResponse
from app.schemas.update import UpdateMemoryRequest
from app.services.gemini_embedding_service import GeminiEmbeddingService

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
    memory_service = MemoryService(db=db)
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
    memory_service = MemoryService(
        db=db,
        embedding_service=GeminiEmbeddingService(),
    )

    result = await memory_service.update_memory(memory_id, project, request)
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
    summary="Delete a memory.",
    description="Deletes a memory belonging to the authenticated project.",
)
async def delete_memory(
    memory_id: UUID,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> None:
    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="delete",
        memory_id=memory_id,
    )
    memory_service = MemoryService(db=db)
    await memory_service.delete_memory(memory_id, project)
