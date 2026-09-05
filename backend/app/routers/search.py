from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_project
from app.models.project import Project
from app.schemas.search import SearchRequest, SearchResponse
from app.services.activity_service import ActivityService

from app.services.search_service import SearchService
from app.services import create_embedding_service
from app.services.usage_service import UsageService
from app.services.rate_limiter import enforce_rate_limit
from app.core.plan_enforcer import get_effective_limits

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
    limits = await get_effective_limits(db, project.owner_id)
    await enforce_rate_limit(project.owner_id, limits["requests_per_hour"])
    embedding_service = create_embedding_service()
    search_service = SearchService(db=db, embedding_service=embedding_service)

    result = await search_service.search(project, request)
    usage = UsageService(db)
    await usage.increment_requests(project.id)
    await usage.increment_searches(project.id)
    activity = ActivityService(db)
    log_details = {"query": request.query[:200], "top_k": request.top_k}
    if request.metadata_filters:
        log_details["metadata_filters"] = request.metadata_filters
    await activity.log(
        project_id=project.id,
        action="search",
        details=log_details,
    )
    return result
