"""
Notion-like notes app using MouseBase for semantic search.

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    python examples/notion.py
"""

import os
from datetime import datetime
from typing import Optional

from mousebase import MouseBase, MouseBaseError


class Note:
    def __init__(
        self,
        memory_id: str,
        title: str,
        body: str,
        tags: list[str],
        created_at: Optional[str] = None,
    ):
        self.memory_id = memory_id
        self.title = title
        self.body = body
        self.tags = tags
        self.created_at = created_at

    @classmethod
    def from_search_result(cls, result) -> "Note":
        meta = result.metadata
        return cls(
            memory_id=result.id,
            title=meta.get("title", "Untitled"),
            body=result.content,
            tags=meta.get("tags", []),
            created_at=meta.get("created_at"),
        )

    def __repr__(self) -> str:
        return f"Note(title={self.title!r}, tags={self.tags})"


class NotionApp:
    def __init__(self, client: MouseBase):
        self.client = client

    def create_note(
        self, title: str, body: str, tags: list[str] | None = None
    ) -> Optional[str]:
        try:
            resp = self.client.remember(
                content=body,
                metadata={
                    "title": title,
                    "tags": tags or [],
                    "created_at": str(datetime.now()),
                    "doc_type": "note",
                },
            )
            print(f"Created note: {title}")
            return resp.memory_id
        except MouseBaseError as e:
            print(f"Failed to create note: {e}")
            return None

    def search_notes(self, query: str, top_k: int = 5) -> list[Note]:
        try:
            response = self.client.search(query, top_k=top_k)
            return [Note.from_search_result(r) for r in response.results]
        except MouseBaseError as e:
            print(f"Search failed: {e}")
            return []

    def update_note(
        self, memory_id: str, title: str | None = None, body: str | None = None
    ) -> bool:
        try:
            metadata = {}
            if title is not None:
                metadata["title"] = title
            self.client.update(memory_id, content=body, metadata=metadata or None)
            print(f"Updated note: {memory_id}")
            return True
        except MouseBaseError as e:
            print(f"Failed to update note: {e}")
            return False

    def delete_note(self, memory_id: str) -> bool:
        try:
            self.client.delete(memory_id)
            print(f"Deleted note: {memory_id}")
            return True
        except MouseBaseError as e:
            print(f"Failed to delete note: {e}")
            return False


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    with MouseBase(api_key=api_key) as client:
        app = NotionApp(client)

        app.create_note(
            "AI Research",
            "Transformers have revolutionized NLP with attention mechanisms.",
            tags=["ai", "nlp"],
        )
        app.create_note(
            "Shopping List", "Milk, eggs, bread, and avocados.", tags=["personal"]
        )
        app.create_note(
            "Meeting Notes",
            "Q3 roadmap: focus on semantic search performance.",
            tags=["work", "meetings"],
        )

        print("\nSearching for 'transformer attention'...")
        for note in app.search_notes("transformer attention"):
            print(f"  [{note.memory_id[:8]}] {note.title} — tags: {note.tags}")


if __name__ == "__main__":
    main()
