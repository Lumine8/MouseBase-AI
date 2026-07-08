from fastapi import APIRouter, Body, Depends, status
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
    description="Stores a new semantic memory for the authenticated project.",
)
async def remember(
    request: RememberRequest = Body(
        openapi_examples={
            "basic": {
                "summary": "Basic memory",
                "description": "Store a simple memory with just content.",
                "value": {
                    "content": "The user clicked on the settings page.",
                    "external_id": None,
                    "metadata": {},
                },
            },
            "with_metadata": {
                "summary": "Memory with metadata",
                "description": "Store a memory with external_id and metadata.",
                "value": {
                    "content": "User completed onboarding flow.",
                    "external_id": "event_123",
                    "metadata": {"source": "onboarding", "version": "2.1"},
                },
            },
        }
    ),
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> RememberResponse:
    embedding_service = GeminiEmbeddingService()
    memory_service = MemoryService(db=db, embedding_service=embedding_service)

    return await memory_service.remember(project, request)
