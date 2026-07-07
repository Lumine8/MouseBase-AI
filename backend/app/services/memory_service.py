from typing import Any
from uuid import UUID

# from pydantic import field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.remember import RememberRequest, RememberResponse
from app.services.embedding_service import EmbeddingService

from app.exceptions.memory import MemoryNotFoundError
from app.exceptions.update import EmptyUpdateError
from app.exceptions.embedding import EmbeddingServiceUnavailableError


from app.models.memory import Memory
from app.schemas.memory import MemoryResponse
from app.schemas.update import UpdateMemoryRequest
from app.models.embedding import Embedding

from app.core.config import settings
# from app.routers import memory

class MemoryService:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService | None = None):
        self.db = db
        self.embedding_service = embedding_service

    async def remember(self, project: Project, request: RememberRequest) -> RememberResponse:
        
        if self.embedding_service is None:
            raise RuntimeError("Embedding service is not initialized.")
        
        vector = await self.embedding_service.embed(request.content)

        memory = Memory(project = project, content = request.content, metadata_ = request.metadata, 
                        external_id = request.external_id)
        
        embedding = Embedding(memory = memory,
                              model = settings.EMBEDDING_MODEL,
                              dimensions = settings.EMBEDDING_DIMENSIONS,
                              vector = vector)

        self.db.add(memory)
        self.db.add(embedding)
        await self.db.commit()
        await self.db.refresh(memory)

        return RememberResponse(memory_id = memory.id, created_at = memory.created_at)
    
    async def _get_memory(self, memory_id: UUID, project: Project) -> Memory:
        stmt = (
            select(Memory).where(Memory.id == memory_id, Memory.project_id == project.id)
        )
        result = await self.db.execute(stmt)
        memory = result.scalar_one_or_none()
        
        if memory is None:
            raise MemoryNotFoundError()
        return memory
    
    def _to_response(self, memory: Memory) -> MemoryResponse:
        return MemoryResponse(
            memory_id=memory.id,
            external_id=memory.external_id,
            content=memory.content,
            metadata=memory.metadata_,
            created_at=memory.created_at,
            updated_at=memory.updated_at,
        )
    
    async def get_memory(self, memory_id: UUID, project: Project) -> MemoryResponse:
        
        memory = await self._get_memory(memory_id, project)
        return self._to_response(memory)
    
    
    async def update_memory(self, memory_id: UUID, project: Project, request: UpdateMemoryRequest) -> MemoryResponse:
        
        memory = await self._get_memory(memory_id, project)
        if request.content is None and request.metadata is None and request.external_id is None:
            raise EmptyUpdateError()
        
        if request.content is not None and request.content != memory.content:
            if self.embedding_service is None:
                raise EmbeddingServiceUnavailableError()
            
            embedding_stmt = select(Embedding).where(Embedding.memory_id == memory.id, Embedding.model == settings.EMBEDDING_MODEL)
            
            embedding_result = await self.db.execute(embedding_stmt)
            embedding = embedding_result.scalar_one_or_none()
            if embedding is None:
                raise EmbeddingServiceUnavailableError()

            memory.content = request.content
            embedding.vector = await self.embedding_service.embed(request.content)


        if request.metadata is not None:
            memory.metadata_ = request.metadata

        if request.external_id is not None:
            memory.external_id = request.external_id

        await self.db.commit()
        await self.db.refresh(memory)
            
        return self._to_response(memory)
    
    async def delete_memory(self, memory_id: UUID, project: Project) -> None:
        memory = await self._get_memory(memory_id, project)

        await self.db.delete(memory)
        await self.db.commit()