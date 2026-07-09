"""
RAG pipeline: retrieve context from MouseBase and format it for an LLM.

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    python examples/rag.py
"""

import os
from mousebase import MouseBase, MouseBaseError


def index_documents(client: MouseBase, docs: list[dict]) -> list[str]:
    ids = []
    for doc in docs:
        try:
            resp = client.remember(
                content=doc["content"],
                metadata={"title": doc.get("title", ""), "source": doc.get("source", "")},
            )
            ids.append(resp.memory_id)
            print(f"  indexed: {doc.get('title', 'untitled')} -> {resp.memory_id}")
        except MouseBaseError as e:
            print(f"  failed to index '{doc.get('title', 'untitle d')}': {e}")
    return ids


def retrieve_context(client: MouseBase, query: str, top_k: int = 3) -> str:
    try:
        response = client.search(query, top_k=top_k)
    except MouseBaseError as e:
        print(f"Search failed: {e}")
        return ""

    if not response.results:
        return ""

    sections = []
    for r in response.results:
        title = r.metadata.get("title", "Untitled")
        sections.append(f"### {title} (relevance: {r.score:.2f})\n{r.content}")

    return "\n\n".join(sections)


def build_prompt(query: str, context: str) -> str:
    return (
        "You are a helpful assistant. Use the following context to answer the question.\n"
        "If the context does not contain the answer, say you don't know.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    documents = [
        {"title": "Python Overview", "content": "Python is a high-level, interpreted programming language known for its readability and versatility.", "source": "wiki"},
        {"title": "MouseBase SDK", "content": "MouseBase provides a simple API for storing and searching memories with semantic embeddings.", "source": "docs"},
        {"title": "RAG Pattern", "content": "Retrieval-Augmented Generation combines a retriever with an LLM to ground responses in external knowledge.", "source": "guide"},
    ]

    with MouseBase(api_key=api_key) as client:
        print("Indexing documents...")
        index_documents(client, documents)

        query = "How does RAG work with semantic search?"
        print(f"\nQuery: {query}\n")

        context = retrieve_context(client, query)
        if not context:
            print("No relevant context found.")
            return

        prompt = build_prompt(query, context)
        print("=" * 60)
        print("PROMPT TO SEND TO LLM")
        print("=" * 60)
        print(prompt)


if __name__ == "__main__":
    main()
