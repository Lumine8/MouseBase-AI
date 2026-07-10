"""
AI agent with session-based memory management using MouseBase.

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    python examples/agent_memory.py
"""

import os
from datetime import datetime
from typing import Optional

from mousebase import MouseBase, MouseBaseError


class SessionMemory:
    def __init__(self, client: MouseBase, session_id: str, agent_name: str = "default"):
        self.client = client
        self.session_id = session_id
        self.agent_name = agent_name

    def remember(self, role: str, content: str) -> Optional[str]:
        try:
            resp = self.client.remember(
                content=content,
                external_id=self.session_id,
                metadata={
                    "agent": self.agent_name,
                    "role": role,
                    "session_id": self.session_id,
                    "timestamp": str(datetime.now()),
                },
            )
            return resp.memory_id
        except MouseBaseError as e:
            print(f"Failed to store memory: {e}")
            return None

    def recall(self, query: str, top_k: int = 5) -> list[dict]:
        try:
            response = self.client.search(
                f"{self.session_id} {query}",
                top_k=top_k,
            )
            messages = []
            for r in response.results:
                if r.external_id == self.session_id:
                    messages.append(
                        {
                            "role": r.metadata.get("role", "unknown"),
                            "content": r.content,
                            "score": r.score,
                        }
                    )
            return messages
        except MouseBaseError as e:
            print(f"Failed to recall memories: {e}")
            return []

    def get_conversation_history(self, top_k: int = 20) -> list[dict]:
        try:
            response = self.client.search(
                self.session_id,
                top_k=top_k,
            )
            conversation = []
            for r in response.results:
                if r.external_id == self.session_id and r.metadata.get("role") in (
                    "user",
                    "assistant",
                ):
                    conversation.append(
                        {
                            "role": r.metadata["role"],
                            "content": r.content,
                            "timestamp": r.metadata.get("timestamp", ""),
                        }
                    )
            conversation.sort(key=lambda m: m.get("timestamp", ""))
            return conversation
        except MouseBaseError as e:
            print(f"Failed to retrieve history: {e}")
            return []

    def forget_session(self) -> bool:
        try:
            response = self.client.search(self.session_id, top_k=100)
            for r in response.results:
                if r.external_id == self.session_id:
                    self.client.delete(r.id)
            print(f"Cleared session: {self.session_id}")
            return True
        except MouseBaseError as e:
            print(f"Failed to clear session: {e}")
            return False

    def summarize(self, top_k: int = 5) -> str:
        messages = self.get_conversation_history(top_k=top_k)
        if not messages:
            return "No conversation history."
        lines = [f"[{m['role']}]: {m['content']}" for m in messages[-top_k:]]
        return "Recent conversation:\n" + "\n".join(lines)


class Agent:
    def __init__(self, name: str):
        self.name = name
        self.client = MouseBase()
        self.sessions: dict[str, SessionMemory] = {}

    def get_session(self, session_id: str) -> SessionMemory:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionMemory(
                self.client, session_id, self.name
            )
        return self.sessions[session_id]

    def chat(self, session_id: str, user_message: str) -> str:
        memory = self.get_session(session_id)

        memory.remember("user", user_message)

        context = memory.recall(user_message, top_k=3)
        history = memory.get_conversation_history(top_k=10)

        reply = f"[{self.name}] Received: '{user_message}'"
        if context:
            reply += f" (found {len(context)} relevant memories)"

        memory.remember("assistant", reply)
        return reply

    def close(self):
        self.client.close()


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    agent = Agent("ResearchBot")

    try:
        session = "session_alice_001"

        print(agent.chat(session, "Hi, I'm researching transformer architectures."))
        print(agent.chat(session, "What are the key innovations in GPT-4?"))
        print(agent.chat(session, "Can you summarize what we discussed?"))

        memory = agent.get_session(session)
        print("\n" + memory.summarize())

    finally:
        agent.close()


if __name__ == "__main__":
    main()
