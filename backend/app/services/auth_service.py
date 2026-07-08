from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.core.security import parse_api_key, verify_api_key
from app.exceptions.auth import InvalidAPIKeyError


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, api_key: str) -> Project:
        key_id, secret = parse_api_key(api_key)
        result = await self.db.execute(
            select(Project).where(Project.api_key_id == key_id)
        )
        project = result.scalar_one_or_none()

        if project is None:
            raise InvalidAPIKeyError()

        if not verify_api_key(secret, project.api_key_hash):
            raise InvalidAPIKeyError()

        return project
