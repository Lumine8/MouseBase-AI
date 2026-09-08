from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String, Numeric

from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.models.project import Project
from app.models.memory import Memory, MemoryStatus
from app.models.embedding import Embedding

WEIGHT_SEMANTIC = 0.50
WEIGHT_KEYWORD = 0.20
WEIGHT_METADATA = 0.10
WEIGHT_RECENCY = 0.05
WEIGHT_IMPORTANCE = 0.15


def _build_metadata_clause(key: str, value: Any):
    """Build a SQLAlchemy WHERE clause for a metadata filter.

    Supports:
    - Exact match: {"key": "value"}
    - Range: {"key": {"$gt": 25}}, {"$lt": 100}, {"$gte": 25}, {"$lte": 100}
    - IN: {"key": {"$in": ["a", "b"]}}
    - Nested: {"user.name": "John"} (dot-notation access)
    """
    # Handle nested keys with dot notation
    metadata_col = Memory.metadata_
    if "." in key:
        parts = key.split(".")
        for part in parts[:-1]:
            metadata_col = metadata_col[part]
        leaf_key = parts[-1]
    else:
        leaf_key = key

    if isinstance(value, dict):
        # Operator-based filters
        clauses = []
        for op, operand in value.items():
            if op == "$gt":
                clauses.append(cast(metadata_col[leaf_key].astext, Numeric) > operand)
            elif op == "$gte":
                clauses.append(cast(metadata_col[leaf_key].astext, Numeric) >= operand)
            elif op == "$lt":
                clauses.append(cast(metadata_col[leaf_key].astext, Numeric) < operand)
            elif op == "$lte":
                clauses.append(cast(metadata_col[leaf_key].astext, Numeric) <= operand)
            elif op == "$in":
                if isinstance(operand, list) and len(operand) > 0:
                    clauses.append(
                        metadata_col[leaf_key].astext.in_([str(v) for v in operand])
                    )
                else:
                    # Empty IN list means nothing matches
                    clauses.append(func.false())
            elif op == "$ne":
                clauses.append(metadata_col[leaf_key].astext != str(operand))
            else:
                raise ValueError(f"Unsupported operator: {op}")
        if len(clauses) == 1:
            return clauses[0]
        from sqlalchemy import and_

        return and_(*clauses)
    else:
        # Exact match
        return metadata_col[leaf_key].astext == str(value)


class SearchService:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    async def search(self, project: Project, request: SearchRequest) -> SearchResponse:
        query_vector = await self.embedding_service.embed(request.query)

        tsquery = func.plainto_tsquery("english", request.query)
        distance = Embedding.vector.cosine_distance(query_vector)

        # Handle null search_vector gracefully with coalesce
        safe_search_vector = func.coalesce(
            Memory.search_vector, func.to_tsvector("english", "")
        )
        fts_rank = func.ts_rank_cd(safe_search_vector, tsquery)

        days_old = func.extract("epoch", func.now() - Memory.created_at) / 86400.0
        recency_score = func.exp(-days_old / 30.0)

        semantic_score = (1.0 - distance).label("semantic_score")

        # Include memories that match FTS or have any embedding
        where_clauses = [
            Memory.project_id == project.id,
            Memory.status != MemoryStatus.DELETED.value,
            Embedding.model == settings.EMBEDDING_MODEL,
        ]

        if request.metadata_filters:
            for key, value in request.metadata_filters.items():
                where_clauses.append(_build_metadata_clause(key, value))

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
            imp_score = max(0.0, min(1.0, float(memory.importance)))

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
                + WEIGHT_IMPORTANCE * imp_score
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
                    created_at=memory.created_at,
                )
            )

        # Sort by score desc, then created_at desc (newer first), then id asc (deterministic)
        scored_results.sort(
            key=lambda r: (
                -r.score,
                -(r.created_at.timestamp() if r.created_at else 0),
                str(r.id),
            )
        )
        return SearchResponse(results=scored_results[: request.top_k])
