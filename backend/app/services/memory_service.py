from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.remember import RememberRequest, RememberResponse
from app.services.embedding_service import EmbeddingService

from app.models.memory import Memory
from app.models.embedding import Embedding

from app.core.config import settings

class MemoryService:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    async def remember(self, project: Project, request: RememberRequest) -> RememberResponse:
        vector = await self.embedding_service.embed(request.content)

        memory = Memory(project = project, content = request.content, metadata_ = request.metadata, 
                        external_id = request.external_id)
        
        embedding = Embedding(memory = memory,
                              model = settings.EMBEDDING_MODEL,
                              dimensions = settings.EMBEDDING_DIMENSIONS,
                              vector = vector)

        self.db.add(memory)
        await self.db.commit()
        await self.db.refresh(memory)

        return RememberResponse(memory_id = memory.id, created_at = memory.created_at)
    