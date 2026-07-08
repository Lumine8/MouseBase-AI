from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import (
    get_current_user_jwt_only,
    get_current_user_or_project as get_current_user,
)
from app.models.user import User
from app.schemas.project import (
    ApiKeyResponse,
    ProjectCreateRequest,
    ProjectKeyResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post(
    "/",
    response_model=ProjectKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
    description="Creates a new project for the authenticated user and returns the API key once.",
)
async def create_project(
    request: ProjectCreateRequest = Body(
        openapi_examples={
            "basic": {
                "summary": "Basic project",
                "description": "Create a project with just a name.",
                "value": {
                    "name": "My Mobile App",
                    "description": None,
                },
            },
            "with_description": {
                "summary": "Project with description",
                "description": "Create a project with a name and description.",
                "value": {
                    "name": "E-commerce Backend",
                    "description": "Memory storage for user behavior tracking.",
                },
            },
        }
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectKeyResponse:
    service = ProjectService(db)
    return await service.create_project(current_user.id, request)


@router.get(
    "/",
    response_model=list[ProjectKeyResponse],
    status_code=status.HTTP_200_OK,
    summary="List projects",
    description="Lists all projects owned by the authenticated user.",
)
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectKeyResponse]:
    service = ProjectService(db)
    return await service.list_projects(current_user.id)


@router.get(
    "/{project_id}",
    response_model=ProjectKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a project",
    description="Retrieves one project owned by the authenticated user.",
)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectKeyResponse:
    service = ProjectService(db)
    return await service.get_project(current_user.id, project_id)


@router.get(
    "/{project_id}/api-key",
    response_model=ApiKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="View API key",
    description=(
        "Returns the full decrypted API key for a project. "
        "Only accessible with a valid JWT (not via API key auth)."
    ),
)
async def get_api_key(
    project_id: UUID,
    current_user: User = Depends(get_current_user_jwt_only),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    service = ProjectService(db)
    return await service.get_api_key(current_user.id, project_id)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a project",
    description="Updates the name or description of a project owned by the authenticated user.",
)
async def update_project(
    project_id: UUID,
    request: ProjectUpdateRequest = Body(
        openapi_examples={
            "update_name": {
                "summary": "Update name",
                "description": "Update only the project name.",
                "value": {
                    "name": "Renamed Project",
                    "description": None,
                },
            },
            "update_description": {
                "summary": "Update description",
                "description": "Update only the project description.",
                "value": {
                    "name": None,
                    "description": "Updated description for the project.",
                },
            },
        }
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    service = ProjectService(db)
    return await service.update_project(current_user.id, project_id, request)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Deletes a project owned by the authenticated user.",
)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = ProjectService(db)
    await service.delete_project(current_user.id, project_id)


@router.post(
    "/{project_id}/api-key/rotate",
    response_model=ProjectKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate a project API key",
    description="Generates a new API key for a project owned by the authenticated user.",
    deprecated=True,
)
async def rotate_project_key_legacy(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectKeyResponse:
    service = ProjectService(db)
    return await service.rotate_key(current_user.id, project_id)


@router.post(
    "/{project_id}/rotate-key",
    response_model=ProjectKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate a project API key",
    description="Generates a new API key for a project owned by the authenticated user.",
)
async def rotate_project_key(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectKeyResponse:
    service = ProjectService(db)
    return await service.rotate_key(current_user.id, project_id)
