from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.models.project import Project
from app.models.memory import Memory
from app.models.embedding import Embedding


class SearchService:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    async def search(self, project: Project, request: SearchRequest) -> SearchResponse:
        query_vector = await self.embedding_service.embed(request.query)
        distance = Embedding.vector.cosine_distance(query_vector)
        stmt = (
            select(Memory, distance.label("distance"))
            .join(Embedding, Embedding.memory_id == Memory.id)
            .where(
                Memory.project_id == project.id,
                Embedding.model == settings.EMBEDDING_MODEL,
            )
            .order_by(distance)
            .limit(request.top_k)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        results = []

        MIN_SCORE = settings.MIN_SCORE

        for memory, distance in rows:
            score = max(0.0, min(1.0, 1 - distance))
            if score < MIN_SCORE:
                continue

            results.append(
                SearchResult(
                    memory_id=memory.id,
                    external_id=memory.external_id,
                    content=memory.content,
                    metadata=memory.metadata_,
                    score=score,
                )
            )
        return SearchResponse(results=results)
