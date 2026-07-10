from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any


class MouseBaseAgentMemory:
    """OpenAI Agents SDK Session implementation backed by MouseBase.

    Stores conversation history as MouseBase memories with session_id in
    metadata.  Implements the ``agents.memory.session.Session`` protocol
    via duck-typing so it can be passed directly to ``Runner.run()``.

    Usage with OpenAI Agents SDK::

        from agents import Agent, Runner
        from mousebase.integrations.openai_agents_memory import (
            MouseBaseAgentMemory,
        )

        memory = MouseBaseAgentMemory(session_id="my_session")
        agent = Agent(name="Assistant")
        result = await Runner.run(agent, "Hello", session=memory)

    All ``openai/agents`` imports are deferred so the package is optional.
    """

    def __init__(
        self,
        session_id: str,
        *,
        api_key: str | None = None,
        max_messages: int | None = None,
        top_k: int = 100,
    ) -> None:
        self.session_id = session_id
        self.max_messages = max_messages
        self.top_k = top_k
        self.session_settings: Any = None
        self._api_key = api_key
        self._client: Any = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_client(self) -> Any:
        if self._client is None:
            from mousebase import MouseBase

            self._client = MouseBase(api_key=self._api_key)
        return self._client

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _apply_limit(
        self,
        messages: list[dict[str, Any]],
        limit: int | None,
    ) -> list[dict[str, Any]]:
        resolved = limit if limit is not None else self.max_messages
        if resolved is not None and len(messages) > resolved:
            return messages[-resolved:]
        return messages

    # ------------------------------------------------------------------
    # OpenAI Agents SDK Session protocol
    # ------------------------------------------------------------------

    async def get_items(self, limit: int | None = None) -> list[dict[str, Any]]:
        """Retrieve conversation history for this session.

        Uses MouseBase semantic search with a high ``top_k`` and filters
        by session_id, then sorts chronologically by timestamp.

        Args:
            limit: Max items.  Falls back to ``session_settings.limit``
                   then ``max_messages`` from the constructor.

        Returns:
            Messages in OpenAI format (``{role, content}``).
        """
        client = self._get_client()

        def _search():
            return client.search(query="", top_k=self.top_k)

        try:
            resp = await asyncio.to_thread(_search)
        except Exception:
            return []

        messages: list[dict[str, Any]] = []
        for result in resp.results:
            meta = result.metadata or {}
            if meta.get("session_id") != self.session_id:
                continue
            messages.append(
                {
                    "role": meta.get("role", "user"),
                    "content": result.content,
                    "_ts": meta.get("timestamp", ""),
                }
            )

        messages.sort(key=lambda m: m["_ts"])
        for m in messages:
            del m["_ts"]

        return self._apply_limit(messages, limit)

    async def add_items(self, items: list[dict[str, Any]]) -> None:
        """Add items to the conversation history.

        Each item is persisted as a MouseBase memory with session_id,
        role and timestamp stored in metadata.

        Args:
            items: List of input items (dicts with ``role`` / ``content``).
        """
        if not items:
            return

        client = self._get_client()
        ts = self._now()

        for item in items:
            import uuid

            content = item.get("content", "")
            role = item.get("role", "user")
            metadata: dict[str, Any] = {
                "session_id": self.session_id,
                "role": role,
                "timestamp": ts,
            }
            ext_id = f"{self.session_id}_{uuid.uuid4().hex}"

            def _store(c=content, m=metadata, e=ext_id):
                return client.remember(content=c, external_id=e, metadata=m)

            await asyncio.to_thread(_store)

    async def pop_item(self) -> dict[str, Any] | None:
        """Remove and return the most recent item.

        Returns:
            The most recent message or ``None`` when empty.
        """
        client = self._get_client()

        def _search():
            return client.search(query="", top_k=self.top_k)

        try:
            resp = await asyncio.to_thread(_search)
        except Exception:
            return None

        candidates: list[tuple[str, str, str]] = []  # id, content, timestamp
        for result in resp.results:
            meta = result.metadata or {}
            if meta.get("session_id") != self.session_id:
                continue
            candidates.append(
                (
                    result.id,
                    result.content,
                    meta.get("timestamp", ""),
                )
            )

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[2], reverse=True)
        latest_id, latest_content, _ = candidates[0]

        def _delete(mid=latest_id):
            client.delete(mid)

        try:
            await asyncio.to_thread(_delete)
        except Exception:
            pass

        return {"role": "user", "content": latest_content}

    async def clear_session(self) -> None:
        """Clear all items for this session."""
        await self._clear_by_session(self.session_id)

    # ------------------------------------------------------------------
    # User-facing convenience API
    # ------------------------------------------------------------------

    async def store_message(self, message: dict[str, Any]) -> None:
        """Store a single message.

        Args:
            message: Dict with at least ``role`` and ``content`` keys.
        """
        await self.add_items([message])

    async def retrieve_messages(
        self,
        thread_id: str,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Retrieve conversation history for a thread.

        Args:
            thread_id: Session / thread identifier.
            limit: Max messages to return.

        Returns:
            Chronologically sorted OpenAI-format messages.
        """
        return await self._get_items_for_thread(thread_id, limit)

    async def _get_items_for_thread(
        self,
        thread_id: str,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        client = self._get_client()

        def _search():
            return client.search(query="", top_k=self.top_k)

        try:
            resp = await asyncio.to_thread(_search)
        except Exception:
            return []

        messages: list[dict[str, Any]] = []
        for result in resp.results:
            meta = result.metadata or {}
            if meta.get("session_id") != thread_id:
                continue
            messages.append(
                {
                    "role": meta.get("role", "user"),
                    "content": result.content,
                    "_ts": meta.get("timestamp", ""),
                }
            )

        messages.sort(key=lambda m: m["_ts"])
        for m in messages:
            del m["_ts"]

        return self._apply_limit(messages, limit)

    async def search_memories(
        self,
        query: str,
        thread_id: str,
    ) -> list[dict[str, Any]]:
        """Semantic search within a thread.

        Delegates to MouseBase's ``search()`` and filters results client-
        side by session_id metadata.

        Args:
            query: Natural-language query.
            thread_id: Scope search to this thread.

        Returns:
            Relevant messages in OpenAI format, relevance-ordered.
        """
        client = self._get_client()

        def _search():
            return client.search(query=query, top_k=self.top_k)

        try:
            resp = await asyncio.to_thread(_search)
        except Exception:
            return []

        results: list[dict[str, Any]] = []
        for result in resp.results:
            meta = result.metadata or {}
            if meta.get("session_id") != thread_id:
                continue
            results.append(
                {
                    "role": meta.get("role", "user"),
                    "content": result.content,
                }
            )

        return results

    async def clear(self, thread_id: str) -> None:
        """Clear all messages for a thread.

        Searches for memories belonging to the thread and deletes them.

        Args:
            thread_id: Session / thread identifier to clear.
        """
        await self._clear_by_session(thread_id)

    async def _clear_by_session(self, session_id: str) -> None:
        client = self._get_client()

        def _search():
            return client.search(query="", top_k=self.top_k)

        try:
            resp = await asyncio.to_thread(_search)
        except Exception:
            return

        for result in resp.results:
            meta = result.metadata or {}
            if meta.get("session_id") == session_id:

                def _delete(mid=result.id):
                    client.delete(mid)

                try:
                    await asyncio.to_thread(_delete)
                except Exception:
                    pass
