from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.models.project import Project
from app.models.memory import Memory
from app.models.embedding import Embedding

WEIGHT_SEMANTIC = 0.60
WEIGHT_KEYWORD = 0.25
WEIGHT_METADATA = 0.10
WEIGHT_RECENCY = 0.05


class SearchService:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    async def search(self, project: Project, request: SearchRequest) -> SearchResponse:
        query_vector = await self.embedding_service.embed(request.query)

        tsquery = func.plainto_tsquery("english", request.query)
        distance = Embedding.vector.cosine_distance(query_vector)
        fts_rank = func.ts_rank_cd(Memory.search_vector, tsquery)

        days_old = func.extract("epoch", func.now() - Memory.created_at) / 86400.0
        recency_score = func.exp(-days_old / 30.0)

        semantic_score = (1.0 - distance).label("semantic_score")

        where_clauses = [
            Memory.project_id == project.id,
            Embedding.model == settings.EMBEDDING_MODEL,
            Memory.search_vector.op("@@")(tsquery) | (distance < 0.5),
        ]

        # Apply metadata filters if provided
        if request.metadata_filters:
            for key, value in request.metadata_filters.items():
                where_clauses.append(Memory.metadata_[key].astext == str(value))

        stmt = (
            select(
                Memory,
                semantic_score,
                fts_rank.label("keyword_score"),
                recency_score.label("recency_score"),
            )
            .join(Embedding, Embedding.memory_id == Memory.id)
            .where(*where_clauses)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        scored_results = []
        MIN_SCORE = settings.MIN_SCORE

        for memory, sem_score, kw_score, rec_score in rows:
            sem_score = max(0.0, min(1.0, float(sem_score)))
            kw_score = max(0.0, min(1.0, float(kw_score)))
            rec_score = max(0.0, min(1.0, float(rec_score)))

            meta_bonus = 0.0
            if memory.metadata_ and request.query:
                query_lower = request.query.lower()
                meta_str = str(memory.metadata_).lower()
                if any(term in meta_str for term in query_lower.split()):
                    meta_bonus = 1.0

            final_score = (
                WEIGHT_SEMANTIC * sem_score
                + WEIGHT_KEYWORD * kw_score
                + WEIGHT_METADATA * meta_bonus
                + WEIGHT_RECENCY * rec_score
            )
            final_score = max(0.0, min(1.0, final_score))

            if final_score < MIN_SCORE:
                continue

            scored_results.append(
                SearchResult(
                    id=memory.id,
                    external_id=memory.external_id,
                    content=memory.content,
                    metadata=memory.metadata_ or {},
                    score=round(final_score, 4),
                )
            )

        scored_results.sort(key=lambda r: (-r.score,))
        return SearchResponse(results=scored_results[: request.top_k])
