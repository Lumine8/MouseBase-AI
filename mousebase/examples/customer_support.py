"""
Support ticket system using MouseBase for issue resolution memory.

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    python examples/customer_support.py
"""

import os
from datetime import datetime
from typing import Optional

from mousebase import MouseBase, MouseBaseError

PRIORITIES = {"low", "medium", "high", "critical"}


class SupportSystem:
    def __init__(self, client: MouseBase):
        self.client = client

    def create_ticket(
        self, user_id: str, issue: str, priority: str = "medium"
    ) -> Optional[str]:
        if priority not in PRIORITIES:
            print(f"Invalid priority: {priority}")
            return None

        try:
            resp = self.client.remember(
                content=issue,
                external_id=user_id,
                metadata={
                    "type": "support_ticket",
                    "priority": priority,
                    "status": "open",
                    "created_at": str(datetime.now()),
                },
            )
            print(f"Ticket created: {resp.memory_id} [{priority}]")
            return resp.memory_id
        except MouseBaseError as e:
            print(f"Failed to create ticket: {e}")
            return None

    def resolve_ticket(self, memory_id: str, resolution: str) -> bool:
        try:
            self.client.update(
                memory_id,
                metadata={"status": "resolved", "resolved_at": str(datetime.now())},
            )
            self.client.remember(
                content=f"Resolution for {memory_id}: {resolution}",
                metadata={"type": "resolution", "parent_ticket": memory_id},
            )
            print(f"Ticket resolved: {memory_id}")
            return True
        except MouseBaseError as e:
            print(f"Failed to resolve ticket: {e}")
            return False

    def find_similar_issues(self, issue: str, top_k: int = 3) -> list[dict]:
        try:
            response = self.client.search(issue, top_k=top_k)
            results = []
            for r in response.results:
                if r.metadata.get("type") == "support_ticket":
                    results.append(
                        {
                            "ticket_id": r.id,
                            "issue": r.content,
                            "priority": r.metadata.get("priority", "unknown"),
                            "status": r.metadata.get("status", "unknown"),
                            "score": r.score,
                        }
                    )
            return results
        except MouseBaseError as e:
            print(f"Search failed: {e}")
            return []

    def get_customer_history(self, user_id: str, top_k: int = 10) -> list[dict]:
        try:
            response = self.client.search(user_id, top_k=top_k)
            history = []
            for r in response.results:
                if (
                    r.external_id == user_id
                    or r.metadata.get("type") == "support_ticket"
                ):
                    history.append(
                        {
                            "content": r.content,
                            "type": r.metadata.get("type", "unknown"),
                            "status": r.metadata.get("status", ""),
                            "timestamp": r.metadata.get("created_at", ""),
                            "score": r.score,
                        }
                    )
            return history
        except MouseBaseError as e:
            print(f"Failed to fetch customer history: {e}")
            return []


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    with MouseBase(api_key=api_key) as client:
        support = SupportSystem(client)

        ticket_id = support.create_ticket(
            "cust_42", "Login returns 500 error after password reset.", "high"
        )

        print("\nSearching for similar issues...")
        similar = support.find_similar_issues("login error after reset")
        for s in similar:
            print(
                f"  [{s['ticket_id'][:8]}] ({s['priority']}, {s['status']}) {s['issue'][:60]}"
            )

        if ticket_id:
            support.resolve_ticket(
                ticket_id, "Cleared session cache and reset auth token."
            )


if __name__ == "__main__":
    main()
