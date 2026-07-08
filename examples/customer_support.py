"""Customer support ticket triage with MouseBase."""

from mousebase import MouseBase
from datetime import datetime

client = MouseBase(api_key="mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E")


def log_ticket(ticket_id: str, description: str, priority: str):
    client.remember(
        description,
        external_id=ticket_id,
        metadata={
            "type": "support_ticket",
            "priority": priority,
            "status": "open",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    print(f"Ticket {ticket_id} logged ({priority}).")


def find_similar_tickets(description: str) -> list:
    results = client.search(description, top_k=3)
    return [
        {
            "id": r.external_id,
            "content": r.content,
            "priority": r.metadata.get("priority", "unknown"),
            "similarity": r.score,
        }
        for r in results
    ]


# Log some tickets
log_ticket("TKT-001", "Cannot log in after password reset", "high")
log_ticket("TKT-002", "Payment failing with error code 402", "critical")
log_ticket("TKT-003", "Where is the settings page?", "low")

# Incoming ticket — find similar ones
new_ticket = "Login page returns 500 error after password change"
similar = find_similar_tickets(new_ticket)

print(f"\nIncoming: {new_ticket}")
print("Similar past tickets:")
for s in similar:
    print(f"  [{s['similarity']:.2f}] {s['id']}: {s['content']} ({s['priority']})")
