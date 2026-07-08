from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.plan_enforcer import check_project_limit
from app.core.security import (
    decrypt_api_key, encrypt_api_key, generate_api_key,
    hash_api_key, parse_api_key,
)
from app.exceptions.project import EmptyProjectUpdateError, ProjectLimitError, ProjectNotFoundError
from app.models.project import Project
from app.schemas.project import (
    ApiKeyResponse,
    ProjectCreateRequest,
    ProjectKeyResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(
        self, owner_id: UUID, request: ProjectCreateRequest
    ) -> ProjectKeyResponse:
        limited, msg = await check_project_limit(self.db, owner_id)
        if limited:
            raise ProjectLimitError(msg)
        api_key = generate_api_key()
        _, secret = parse_api_key(api_key.key)
        project = Project(
            owner_id=owner_id,
            name=request.name,
            description=request.description,
            api_key_id=api_key.key_id,
            api_key_hash=hash_api_key(secret),
            api_key_encrypted=encrypt_api_key(api_key.key),
        )

        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)

        payload = ProjectResponse.model_validate(project).model_dump()
        payload["api_key"] = api_key.key
        return ProjectKeyResponse.model_validate(payload)

    async def list_projects(self, owner_id: UUID) -> list[ProjectKeyResponse]:
        stmt = select(Project).where(Project.owner_id == owner_id).order_by(Project.created_at.desc())
        result = await self.db.execute(stmt)
        projects = result.scalars().all()
        result_list = []
        for p in projects:
            payload = ProjectResponse.model_validate(p).model_dump()
            if p.api_key_encrypted:
                payload["api_key"] = decrypt_api_key(p.api_key_encrypted)
            result_list.append(ProjectKeyResponse.model_validate(payload))
        return result_list

    async def get_project(self, owner_id: UUID, project_id: UUID) -> ProjectKeyResponse:
        project = await self._get_owned_project(owner_id, project_id)
        payload = ProjectResponse.model_validate(project).model_dump()
        if project.api_key_encrypted:
            payload["api_key"] = decrypt_api_key(project.api_key_encrypted)
        return ProjectKeyResponse.model_validate(payload)

    async def get_api_key(self, owner_id: UUID, project_id: UUID) -> ApiKeyResponse:
        project = await self._get_owned_project(owner_id, project_id)
        if not project.api_key_encrypted:
            raise ValueError("No encrypted API key stored. Rotate the key first.")
        return ApiKeyResponse(
            project_id=project.id,
            api_key=decrypt_api_key(project.api_key_encrypted),
        )

    async def update_project(
        self, owner_id: UUID, project_id: UUID, request: ProjectUpdateRequest
    ) -> ProjectResponse:
        if request.name is None and request.description is None:
            raise EmptyProjectUpdateError()

        project = await self._get_owned_project(owner_id, project_id)

        if request.name is not None:
            project.name = request.name
        if request.description is not None:
            project.description = request.description

        await self.db.commit()
        await self.db.refresh(project)
        return ProjectResponse.model_validate(project)

    async def delete_project(self, owner_id: UUID, project_id: UUID) -> None:
        project = await self._get_owned_project(owner_id, project_id)
        await self.db.delete(project)
        await self.db.commit()

    async def rotate_key(self, owner_id: UUID, project_id: UUID) -> ProjectKeyResponse:
        project = await self._get_owned_project(owner_id, project_id)
        api_key = generate_api_key()
        _, secret = parse_api_key(api_key.key)
        project.api_key_id = api_key.key_id
        project.api_key_hash = hash_api_key(secret)
        project.api_key_encrypted = encrypt_api_key(api_key.key)

        await self.db.commit()
        await self.db.refresh(project)

        payload = ProjectResponse.model_validate(project).model_dump()
        payload["api_key"] = api_key.key
        return ProjectKeyResponse.model_validate(payload)

    async def _get_owned_project(self, owner_id: UUID, project_id: UUID) -> Project:
        stmt = select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
        result = await self.db.execute(stmt)
        project = result.scalar_one_or_none()

        if project is None:
            raise ProjectNotFoundError()

        return project
