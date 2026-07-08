"""Autonomous AI agent with persistent memory using MouseBase."""

from mousebase import MouseBase

client = MouseBase(api_key="mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E")

AGENT_ID = "assistant-alice"


class AgentMemory:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id

    def remember(self, event: str, context: dict | None = None):
        client.remember(
            event,
            external_id=self.agent_id,
            metadata={
                "agent": self.agent_id,
                "type": "event",
                **(context or {}),
            },
        )

    def recall(self, query: str, limit: int = 5) -> list[str]:
        results = client.search(query, top_k=limit)
        return [r.content for r in results]

    def get_state(self, key: str) -> str | None:
        results = client.search(f"state:{key}", top_k=1)
        if results:
            return results[0].content
        return None

    def set_state(self, key: str, value: str):
        client.remember(
            f"state:{key} = {value}",
            external_id=self.agent_id,
            metadata={"agent": self.agent_id, "type": "state", "state_key": key},
        )


memory = AgentMemory(AGENT_ID)

# Agent observes and learns
memory.remember("User asked about pricing", {"topic": "pricing"})
memory.remember("User upgraded to pro plan", {"topic": "billing"})
memory.set_state("current_project", "customer-portal")

# Agent recalls past context
print("Recalling pricing conversations:")
for event in memory.recall("pricing"):
    print(f"  - {event}")

print(f"\nCurrent project: {memory.get_state('current_project')}")
