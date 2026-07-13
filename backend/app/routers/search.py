from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_project
from app.models.project import Project
from app.schemas.search import SearchRequest, SearchResponse
from app.services.activity_service import ActivityService

from app.services.gemini_embedding_service import GeminiEmbeddingService
from app.services.search_service import SearchService

router = APIRouter(
    prefix="/search",
    tags=["search"],
)


@router.post(
    "/",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search for memories in the authenticated project",
    description="Performs semantic search over memories belonging to the authenticated project.",
)
async def search(
    request: SearchRequest = Body(
        openapi_examples={
            "basic": {
                "summary": "Simple search",
                "description": "Search with a default top_k of 10.",
                "value": {
                    "query": "user settings page",
                    "top_k": 10,
                },
            },
            "custom_top_k": {
                "summary": "Search with custom top_k",
                "description": "Search and return only the top 3 results.",
                "value": {
                    "query": "onboarding flow",
                    "top_k": 3,
                },
            },
        }
    ),
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    embedding_service = GeminiEmbeddingService()
    search_service = SearchService(db=db, embedding_service=embedding_service)

    result = await search_service.search(project, request)
    activity = ActivityService(db)
    await activity.log(
        project_id=project.id,
        action="search",
        details={"query": request.query[:200], "top_k": request.top_k},
    )
    return result
