"""
Minimal example: save and search notes with MouseBase.

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    python examples/notes.py
"""

import os
from mousebase import MouseBase


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    with MouseBase(api_key=api_key) as client:
        notes = [
            "The user onboarding flow should take less than 30 seconds.",
            "Customer support tickets are categorized by priority and source.",
            "The dashboard shows daily active users and retention metrics.",
        ]

        for note in notes:
            result = client.remember(content=note, metadata={"source": "notes_example"})
            print(f"Stored: {result.memory_id} at {result.created_at}")

        results = client.search(query="user onboarding metrics", top_k=3)
        print(f"\nSearch results ({len(results.results)}):")
        for r in results.results:
            print(f"  [{r.score:.2f}] {r.content}")


if __name__ == "__main__":
    main()
