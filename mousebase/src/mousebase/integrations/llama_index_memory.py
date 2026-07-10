from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class MouseBaseChatMemory:
    """LlamaIndex chat memory backed by MouseBase's semantic search.

    Stores chat messages as MouseBase memories with ``session_id`` in
    metadata and retrieves conversation history via semantic search.

    All LlamaIndex imports are performed lazily so the module can be
    imported without ``llama-index`` installed.

    Usage::

        from mousebase.integrations.llama_index_memory import MouseBaseChatMemory

        memory = MouseBaseChatMemory(api_key="...", session_id="abc123")
        messages = memory.get("Hello!")
        memory.put(ChatMessage(role=MessageRole.USER, content="Hello!"))
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        session_id: str | None = None,
        top_k: int = 10,
        **kwargs: Any,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._session_id = session_id
        self._top_k = top_k
        self._kwargs = kwargs
        self._client: Any = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _lazy_client(self) -> Any:
        if self._client is None:
            from mousebase import MouseBase

            self._client = MouseBase(
                api_key=self._api_key,
                base_url=self._base_url,
                **self._kwargs,
            )
        return self._client

    @staticmethod
    def _import_llama():
        try:
            from llama_index.core.base.llms.types import ChatMessage, MessageRole
        except ImportError:
            raise ImportError(
                "llama_index is required to use MouseBaseChatMemory. "
                "Install it with: pip install llama-index"
            )
        return ChatMessage, MessageRole

    @staticmethod
    def _message_to_dict(message: Any) -> dict[str, Any]:
        role = str(
            message.role.value if hasattr(message.role, "value") else message.role
        )
        content = message.content if hasattr(message, "content") else str(message)
        extra = dict(getattr(message, "additional_kwargs", {}) or {})
        metadata: dict[str, Any] = {"role": role, **extra}
        return {"content": content or "", "metadata": metadata}

    @staticmethod
    def _dict_to_message(data: dict[str, Any]) -> Any:
        ChatMessage, MessageRole = MouseBaseChatMemory._import_llama()

        meta = dict(data.get("metadata", {}) or {})
        role_str = meta.pop("role", "user")

        role_map = {
            "user": MessageRole.USER,
            "assistant": MessageRole.ASSISTANT,
            "system": MessageRole.SYSTEM,
            "MessageRole.USER": MessageRole.USER,
            "MessageRole.ASSISTANT": MessageRole.ASSISTANT,
            "MessageRole.SYSTEM": MessageRole.SYSTEM,
        }
        role = role_map.get(role_str, MessageRole.USER)

        meta.pop("session_id", None)
        meta["memory_id"] = data.get("id")

        return ChatMessage(
            content=data.get("content", ""),
            role=role,
            additional_kwargs=meta,
        )

    def _ensure_session(self, session_id: str | None = None) -> str:
        sid = session_id or self._session_id
        if not sid:
            raise ValueError(
                "A session_id is required. Pass it to the constructor "
                "or to the method call."
            )
        return sid

    def _store(self, content: str, role: str, session_id: str) -> None:
        metadata: dict[str, Any] = {
            "role": role,
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        external_id = f"{session_id}_{uuid.uuid4().hex}"

        try:
            self._lazy_client().remember(
                content=content,
                external_id=external_id,
                metadata=metadata,
            )
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(
        self,
        inputs: Any = None,
        session_id: str | None = None,
        top_k: int | None = None,
    ) -> list[Any]:
        """Retrieve relevant chat history via semantic search.

        Args:
            inputs: Current input text (or dict with an ``"input"`` key)
                    used as the search query.
            session_id: Override the default session id.
            top_k: Override the default ``top_k`` for this call.

        Returns:
            Chronologically sorted list of ``ChatMessage`` objects.
        """
        query = ""
        if inputs is not None:
            if isinstance(inputs, dict):
                query = inputs.get("input", "")
            elif isinstance(inputs, str):
                query = inputs
            else:
                query = str(inputs)

        sid = self._ensure_session(session_id)
        k = top_k if top_k is not None else self._top_k

        try:
            response = self._lazy_client().search(query=query or " ", top_k=k)
        except Exception:
            return []

        messages: list[Any] = []
        for result in response.results:
            meta = result.metadata or {}
            if meta.get("session_id") != sid:
                continue
            messages.append(
                self._dict_to_message(
                    {"id": result.id, "content": result.content, "metadata": meta}
                )
            )

        messages.sort(key=lambda m: m.additional_kwargs.get("timestamp", ""))
        return messages

    def put(self, message: Any, session_id: str | None = None) -> None:
        """Store a single chat message.

        Args:
            message: A LlamaIndex ``ChatMessage`` instance.
            session_id: Override the default session id.
        """
        sid = self._ensure_session(session_id)
        mdict = self._message_to_dict(message)
        self._store(
            content=mdict["content"],
            role=mdict["metadata"].get("role", "user"),
            session_id=sid,
        )

    def set(self, messages: list[Any], session_id: str | None = None) -> None:
        """Replace all messages for a session.

        Clears existing messages for the session, then stores the provided
        messages.

        Args:
            messages: List of LlamaIndex ``ChatMessage`` instances.
            session_id: Override the default session id.
        """
        sid = self._ensure_session(session_id)
        self.clear(session_id=sid)
        for msg in messages:
            self.put(msg, session_id=sid)

    def clear(self, session_id: str | None = None) -> None:
        """Remove all stored messages for a session.

        Args:
            session_id: Override the default session id.
        """
        sid = self._ensure_session(session_id)

        try:
            response = self._lazy_client().search(query=" ", top_k=500)
        except Exception:
            return

        for result in response.results:
            meta = result.metadata or {}
            if meta.get("session_id") == sid:
                try:
                    self._lazy_client().delete(result.id)
                except Exception:
                    pass

    def get_messages(
        self,
        session_id: str,
        top_k: int = 50,
    ) -> list[Any]:
        """Return all chat messages for a given session.

        Args:
            session_id: The session to fetch messages for.
            top_k: Maximum number of memories to retrieve.

        Returns:
            Chronologically sorted list of ``ChatMessage`` instances.
        """
        return self.get(inputs=None, session_id=session_id, top_k=top_k)
