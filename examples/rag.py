"""Retrieval-Augmented Generation (RAG) pipeline with MouseBase."""

from mousebase import MouseBase

client = MouseBase(api_key="mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E")

# Ingest documents
documents = [
    "MouseBase uses pgvector for vector similarity search.",
    "The API supports semantic search with cosine distance.",
    "Embeddings are generated using Google Gemini or OpenAI.",
    "Each project has its own isolated namespace of memories.",
    "Memories can store arbitrary metadata as key-value pairs.",
]

for doc in documents:
    client.remember(doc, metadata={"source": "docs", "type": "knowledge"})

print(f"Ingested {len(documents)} documents.\n")

# Query
query = "How does semantic search work in MouseBase?"
results = client.search(query, top_k=3)

print(f"Query: {query}\n")
print("Retrieved context:")
for r in results:
    print(f"  [{r.score:.2f}] {r.content}")

# In production, pass the retrieved context to an LLM:
# response = llm.generate(prompt=query, context=results)
