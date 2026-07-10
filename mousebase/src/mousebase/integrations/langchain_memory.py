from __future__ import annotations

from typing import Any

from mousebase import MouseBase


class MouseBaseMemory:
    """LangChain memory backed by MouseBase's semantic search.

    Drop-in replacement for ``ConversationBufferMemory`` that persists
    conversation history on MouseBase and searches by session ID.

    Usage::

        from mousebase.integrations.langchain_memory import MouseBaseMemory

        memory = MouseBaseMemory(api_key="...", session_id="abc123")
        memory.save_context({"input": "Hi"}, {"output": "Hello!"})
        variables = memory.load_memory_variables({})
        # variables["history"] -> "Human: Hi\\nAI: Hello!"
    """

    def __init__(
        self,
        api_key: str | None = None,
        session_id: str = "default",
        top_k: int = 50,
        **kwargs: Any,
    ):
        self.session_id = session_id
        self.top_k = top_k
        self._client = MouseBase(api_key=api_key, **kwargs)

    @property
    def memory_variables(self) -> list[str]:
        return ["history"]

    def load_memory_variables(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Retrieve conversation history for the current session via semantic search.

        The last *top_k* messages are returned as a single string (or a list of
        messages) depending on the buffer string format used by downstream
        chains.
        """
        try:
            response = self._client.search(
                query=inputs.get("input", ""),
                top_k=self.top_k,
            )
        except Exception:
            return {"history": ""}

        messages: list[dict[str, Any]] = []
        for result in response.results:
            meta = result.metadata or {}
            if meta.get("session_id") != self.session_id:
                continue
            role = meta.get("role", "user")
            messages.append(
                {
                    "role": role,
                    "content": result.content,
                    "timestamp": meta.get("timestamp", ""),
                }
            )

        messages.sort(key=lambda m: m.get("timestamp", ""))

        lines = []
        for m in messages:
            if m["role"] == "ai":
                lines.append(f"AI: {m['content']}")
            else:
                lines.append(f"Human: {m['content']}")

        history = "\n".join(lines)
        return {"history": history}

    def save_context(self, inputs: dict[str, Any], outputs: dict[str, Any]) -> None:
        from langchain_core.messages import BaseMessage

        input_str = inputs.get("input", "")
        output_str = outputs.get("output", "")

        if isinstance(input_str, BaseMessage):
            input_str = input_str.content
        if isinstance(output_str, BaseMessage):
            output_str = output_str.content

        try:
            self._store_message(input_str, "user")
            self._store_message(output_str, "ai")
        except Exception:
            pass

    def _store_message(self, content: str, role: str) -> None:
        import uuid
        from datetime import datetime, timezone

        metadata = {
            "role": role,
            "session_id": self.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        external_id = f"{self.session_id}_{uuid.uuid4().hex}"

        self._client.remember(
            content=content,
            external_id=external_id,
            metadata=metadata,
        )

    def clear(self) -> None:
        self._clear_session()

    def _clear_session(self) -> None:
        try:
            response = self._client.search(
                query="",
                top_k=self.top_k * 2,
            )
        except Exception:
            return

        count = 0
        for result in response.results:
            meta = result.metadata or {}
            if meta.get("session_id") == self.session_id:
                try:
                    self._client.delete(result.id)
                    count += 1
                except Exception:
                    pass

    @property
    def chat_memory(self):
        """Return a simple chat memory container for LangChain compatibility.

        Provides .messages, .add_user_message(), .add_ai_message() so that
        ``ChatOpenAI(memory=...)`` and similar high-level APIs work.
        """
        return _ChatMemoryAdapter(self)

    @property
    def buffer(self) -> str:
        return self.load_memory_variables({}).get("history", "")

    @buffer.setter
    def buffer(self, value: str) -> None:
        pass


class _ChatMemoryAdapter:
    """Minimal adapter that exposes the ``.messages`` / ``.add_*`` contract."""

    def __init__(self, memory: MouseBaseMemory) -> None:
        self._memory = memory
        self._messages: list = []

    @property
    def messages(self) -> list:
        from langchain_core.messages import HumanMessage, AIMessage

        history = self._memory.load_memory_variables({}).get("history", "")
        msgs: list = []
        for line in history.split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("AI:"):
                msgs.append(AIMessage(content=line[3:].strip()))
            elif line.startswith("Human:"):
                msgs.append(HumanMessage(content=line[6:].strip()))
        self._messages = msgs
        return msgs

    @messages.setter
    def messages(self, value: list) -> None:
        self._messages = value

    def add_user_message(self, message: str) -> None:
        self._memory._store_message(message, "user")

    def add_ai_message(self, message: str) -> None:
        self._memory._store_message(message, "ai")
