from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.core.security import verify_api_key


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def authenticate(self, api_key: str)-> Project:
        result = await self.db.execute(select(Project))
        projects = result.scalars().all()

        for project in projects:
            if verify_api_key(api_key, project.api_key_hash):
                return project
            