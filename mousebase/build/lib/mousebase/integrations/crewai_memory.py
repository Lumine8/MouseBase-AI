from __future__ import annotations

import time
from datetime import datetime
from typing import Any

__all__ = ["MouseBaseMemory"]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class MouseBaseMemory:
    """CrewAI `StorageBackend` adapter backed by MouseBase.

    Stores and retrieves memory records through the MouseBase managed
    memory service.  Embedding is handled server-side by MouseBase.

    Typical usage with CrewAI's unified ``Memory``::

        from crewai import Memory
        from mousebase.integrations.crewai_memory import MouseBaseMemory

        memory = Memory(storage=MouseBaseMemory(api_key="..."))
        memory.remember("some fact")
        matches = memory.recall("some fact")

    The adapter also exposes three convenience methods (``add``,
    ``search``, ``clear``) for direct use without CrewAI.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: int = 30,
        embedder_config: dict[str, Any] | None = None,
        collection_name: str | None = None,
    ):
        self._api_key = api_key
        self._base_url = base_url
        self._timeout = timeout
        self._embedder_config = embedder_config
        self._collection_name = collection_name
        self._client: Any = None
        self._external_id_prefix = collection_name or "crewai"

    def _lazy_client(self) -> Any:
        if self._client is None:
            from mousebase import MouseBase

            self._client = MouseBase(
                api_key=self._api_key,
                base_url=self._base_url,
                timeout=self._timeout,
            )
        return self._client

    # ------------------------------------------------------------------
    # CrewAI StorageBackend protocol
    # ------------------------------------------------------------------

    def save(self, records: list[Any]) -> None:
        """Save memory records to MouseBase."""
        client = self._lazy_client()
        for r in records:
            meta = dict(r.metadata or {})
            meta["_scope"] = r.scope
            meta["_categories"] = r.categories
            meta["_importance"] = r.importance
            meta["_source"] = r.source
            meta["_private"] = r.private
            if r.embedding is not None:
                meta["_embedding"] = r.embedding
            if r.last_accessed is not None:
                meta["_last_accessed"] = r.last_accessed.isoformat()
            client.remember(
                content=r.content,
                external_id=f"{self._external_id_prefix}:{r.id}",
                metadata=meta,
            )

    def search(
        self,
        query_embedding: list[float],
        scope_prefix: str | None = None,
        categories: list[str] | None = None,
        metadata_filter: dict[str, Any] | None = None,
        limit: int = 10,
        min_score: float = 0.0,
    ) -> list[tuple[Any, float]]:
        """Search memories by vector similarity.

        Because MouseBase manages embeddings server-side, this method
        searches locally against previously stored embeddings when a
        ``query_embedding`` is provided.  If ``metadata_filter`` contains
        a ``query`` key, MouseBase's native text search is used instead.

        Returns a list of ``(MemoryRecord, score)`` tuples.
        """
        from crewai.memory.storage.backend import MemoryRecord

        client = self._lazy_client()

        text_query = (
            metadata_filter.pop("query", None) if metadata_filter else None
        )

        if text_query:
            scope_part = f"{scope_prefix} " if scope_prefix else ""
            response = client.search(f"{scope_part}{text_query}", top_k=limit)
            results: list[tuple[Any, float]] = []
            for hit in response.results:
                if hit.score < min_score:
                    continue
                meta = dict(hit.metadata or {})
                record = MemoryRecord(
                    id=(hit.external_id or "").replace(
                        f"{self._external_id_prefix}:", ""
                    )
                    or hit.id,
                    content=hit.content,
                    scope=meta.pop("_scope", "/"),
                    categories=meta.pop("_categories", []),
                    metadata=meta,
                    importance=meta.pop("_importance", 0.5),
                )
                results.append((record, hit.score))
            return results

        return self._local_search(
            query_embedding,
            scope_prefix=scope_prefix,
            categories=categories,
            metadata_filter=metadata_filter,
            limit=limit,
            min_score=min_score,
        )

    def _local_search(
        self,
        query_embedding: list[float],
        scope_prefix: str | None = None,
        categories: list[str] | None = None,
        metadata_filter: dict[str, Any] | None = None,
        limit: int = 10,
        min_score: float = 0.0,
    ) -> list[tuple[Any, float]]:
        from crewai.memory.storage.backend import MemoryRecord

        client = self._lazy_client()
        es = self._external_id_prefix

        candidates: list[tuple[MemoryRecord, float]] = []
        cursor = None
        while len(candidates) < limit * 5:
            response = client.search(
                f"{es} cursor:{cursor or ''}",
                top_k=max(limit * 5, 50),
            )
            if not response.results:
                break
            for hit in response.results:
                if hit.external_id and not hit.external_id.startswith(f"{es}:"):
                    continue
                meta = dict(hit.metadata or {})
                emb = meta.pop("_embedding", None)
                if not emb:
                    continue
                if scope_prefix and meta.get("_scope", "/") != scope_prefix:
                    continue
                if categories and not any(
                    c in meta.get("_categories", []) for c in categories
                ):
                    continue
                if metadata_filter:
                    if not all(
                        meta.get(k) == v for k, v in metadata_filter.items()
                    ):
                        continue
                score = _cosine_similarity(query_embedding, emb)
                if score < min_score:
                    continue
                record = MemoryRecord(
                    id=(hit.external_id or "").replace(f"{es}:", "")
                    or hit.id,
                    content=hit.content,
                    scope=meta.pop("_scope", "/"),
                    categories=meta.pop("_categories", []),
                    metadata=meta,
                    importance=meta.pop("_importance", 0.5),
                )
                candidates.append((record, score))
                if len(candidates) >= limit * 5:
                    break
            cursor = time.time()

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:limit]

    def delete(
        self,
        scope_prefix: str | None = None,
        categories: list[str] | None = None,
        record_ids: list[str] | None = None,
        older_than: datetime | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> int:
        """Delete memories matching the given criteria."""
        client = self._lazy_client()
        es = self._external_id_prefix
        deleted = 0

        if record_ids:
            for rid in record_ids:
                ext_id = f"{es}:{rid}"
                response = client.search(ext_id, top_k=10)
                for hit in response.results:
                    if hit.external_id == ext_id:
                        client.delete(hit.id)
                        deleted += 1
            return deleted

        query_parts = [es]
        if scope_prefix:
            query_parts.append(scope_prefix)
        response = client.search(" ".join(query_parts), top_k=100)
        for hit in response.results:
            if hit.external_id and not hit.external_id.startswith(f"{es}:"):
                continue
            meta = dict(hit.metadata or {})
            if scope_prefix and meta.get("_scope", "/") != scope_prefix:
                continue
            if categories and not any(
                c in meta.get("_categories", []) for c in categories
            ):
                continue
            if metadata_filter and not all(
                meta.get(k) == v for k, v in metadata_filter.items()
            ):
                continue
            if older_than:
                created = meta.get("_created_at")
                if created:
                    try:
                        dt = datetime.fromisoformat(created)
                        if dt >= older_than:
                            continue
                    except (ValueError, TypeError):
                        pass
            client.delete(hit.id)
            deleted += 1
        return deleted

    def update(self, record: Any) -> None:
        """Update an existing record."""

        client = self._lazy_client()
        es = self._external_id_prefix
        ext_id = f"{es}:{record.id}"
        response = client.search(ext_id, top_k=5)
        for hit in response.results:
            if hit.external_id == ext_id:
                meta = dict(record.metadata or {})
                meta["_scope"] = record.scope
                meta["_categories"] = record.categories
                client.update(
                    hit.id,
                    content=record.content,
                    metadata=meta,
                )
                return

        self.save([record])

    def get_record(self, record_id: str) -> Any | None:
        """Return a single record by ID, or ``None`` if not found."""
        from crewai.memory.storage.backend import MemoryRecord

        client = self._lazy_client()
        es = self._external_id_prefix
        ext_id = f"{es}:{record_id}"
        response = client.search(ext_id, top_k=5)
        for hit in response.results:
            if hit.external_id == ext_id:
                meta = dict(hit.metadata or {})
                return MemoryRecord(
                    id=record_id,
                    content=hit.content,
                    scope=meta.pop("_scope", "/"),
                    categories=meta.pop("_categories", []),
                    metadata=meta,
                    importance=meta.pop("_importance", 0.5),
                )
        return None

    def list_records(
        self,
        scope_prefix: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[Any]:
        """List records in a scope, newest first."""
        from crewai.memory.storage.backend import MemoryRecord

        client = self._lazy_client()
        es = self._external_id_prefix
        collected: list[MemoryRecord] = []

        query = es
        if scope_prefix:
            query = f"{query} {scope_prefix}"
        response = client.search(query, top_k=limit + offset)
        for hit in response.results:
            if hit.external_id and not hit.external_id.startswith(f"{es}:"):
                continue
            meta = dict(hit.metadata or {})
            if scope_prefix and meta.get("_scope", "/") != scope_prefix:
                continue
            if len(collected) >= limit + offset:
                break
            collected.append(
                MemoryRecord(
                    id=(hit.external_id or "").replace(f"{es}:", "")
                    or hit.id,
                    content=hit.content,
                    scope=meta.pop("_scope", "/"),
                    categories=meta.pop("_categories", []),
                    metadata=meta,
                    importance=meta.pop("_importance", 0.5),
                )
            )

        return collected[offset:][:limit]

    def get_scope_info(self, scope: str) -> Any:
        """Get information about a scope."""
        from crewai.memory.storage.backend import ScopeInfo

        records = self.list_records(scope_prefix=scope, limit=1000)
        if not records:
            return ScopeInfo(path=scope)
        categories = sorted(
            {c for r in records for c in r.categories}
        )
        timestamps = [
            r.created_at for r in records if r.created_at is not None
        ]
        return ScopeInfo(
            path=scope,
            record_count=len(records),
            categories=categories,
            oldest_record=min(timestamps) if timestamps else None,
            newest_record=max(timestamps) if timestamps else None,
        )

    def list_scopes(self, parent: str = "/") -> list[str]:
        """List immediate child scopes under a parent path."""
        all_records = self.list_records(scope_prefix=parent, limit=5000)
        scopes: set[str] = set()
        for r in all_records:
            s = r.scope or "/"
            if s.startswith(parent) and s != parent:
                remainder = s[len(parent):].strip("/")
                if "/" in remainder:
                    child = f"{parent.rstrip('/')}/{remainder.split('/')[0]}"
                else:
                    child = s
                scopes.add(child.rstrip("/") or "/")
        return sorted(scopes)[:limit] if (limit := 200) else sorted(scopes)

    def list_categories(
        self, scope_prefix: str | None = None
    ) -> dict[str, int]:
        """List categories and their counts within a scope."""
        records = self.list_records(
            scope_prefix=scope_prefix, limit=5000
        )
        counts: dict[str, int] = {}
        for r in records:
            for c in r.categories:
                counts[c] = counts.get(c, 0) + 1
        return counts

    def count(self, scope_prefix: str | None = None) -> int:
        """Count records in scope (and subscopes)."""
        if scope_prefix:
            return len(
                self.list_records(scope_prefix=scope_prefix, limit=5000)
            )
        client = self._lazy_client()
        response = client.search(self._external_id_prefix, top_k=1)
        return response.results[0].metadata.get(
            "_total", len(response.results)
        ) if response.results else 0

    def reset(self, scope_prefix: str | None = None) -> None:
        """Reset (delete all) memories in scope."""
        self.delete(scope_prefix=scope_prefix)

    # ------------------------------------------------------------------
    # Async protocol stubs
    # ------------------------------------------------------------------

    async def asave(self, records: list[Any]) -> None:
        self.save(records)

    async def asearch(
        self,
        query_embedding: list[float],
        scope_prefix: str | None = None,
        categories: list[str] | None = None,
        metadata_filter: dict[str, Any] | None = None,
        limit: int = 10,
        min_score: float = 0.0,
    ) -> list[tuple[Any, float]]:
        return self.search(
            query_embedding,
            scope_prefix=scope_prefix,
            categories=categories,
            metadata_filter=metadata_filter,
            limit=limit,
            min_score=min_score,
        )

    async def adelete(
        self,
        scope_prefix: str | None = None,
        categories: list[str] | None = None,
        record_ids: list[str] | None = None,
        older_than: datetime | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> int:
        return self.delete(
            scope_prefix=scope_prefix,
            categories=categories,
            record_ids=record_ids,
            older_than=older_than,
            metadata_filter=metadata_filter,
        )

    # ------------------------------------------------------------------
    # Convenience methods (simpler interface)
    # ------------------------------------------------------------------

    def add(
        self,
        context: str,
        metadata: dict[str, Any] | None = None,
    ) -> str | None:
        """Store a memory and return its ID.

        Parameters
        ----------
        context:
            The text content to remember.
        metadata:
            Optional key-value pairs (e.g. ``agent``, ``task``,
            ``session``, ``timestamp``).
        """
        meta = dict(metadata or {})
        meta.setdefault("timestamp", datetime.utcnow().isoformat())
        client = self._lazy_client()
        resp = client.remember(
            content=context,
            external_id=self._external_id_prefix,
            metadata=meta,
        )
        return resp.id

    def query(
        self,
        query: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Search memories by text similarity.

        Parameters
        ----------
        query:
            Natural language query string.
        limit:
            Maximum number of results.

        Returns
        -------
        List of dicts with keys ``id``, ``content``, ``metadata``,
        ``score``.
        """
        client = self._lazy_client()
        response = client.search(
            f"{self._external_id_prefix} {query}", top_k=limit
        )
        return [
            {
                "id": r.id,
                "content": r.content,
                "metadata": dict(r.metadata or {}),
                "score": r.score,
            }
            for r in response.results
        ]

    def clear(self) -> None:
        """Delete all memories stored by this adapter."""
        self.reset()
