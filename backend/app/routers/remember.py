from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_project
from app.models.project import Project
from app.schemas.remember import RememberRequest, RememberResponse

from app.services.gemini_embedding_service import GeminiEmbeddingService
from app.services.memory_service import MemoryService

router = APIRouter(
    prefix="/remember",
    tags=["memory"],
)


@router.post(
    "/",
    response_model=RememberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Remember a memory for the authenticated project",
)
async def remember(
    request: RememberRequest,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> RememberResponse:
    embedding_service = GeminiEmbeddingService()
    memory_service = MemoryService(db=db, embedding_service=embedding_service)

    return await memory_service.remember(project, request)
