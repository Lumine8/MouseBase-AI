# Show HN: MouseBase – Persistent memory infrastructure for AI agents

**Title:** Show HN: MouseBase – Persistent memory infrastructure for AI agents

**Post:**

Hey HN,

I built MouseBase (https://mousebase.dev) — a hosted API that gives AI agents persistent memory. Think of it as a memory layer between your agent and your database.

**The problem:**
Every time your AI agent starts a new conversation, it forgets everything. Vector DBs give you RAG but not real memory — no versioning, no lifecycle management, no search that actually works across different query types.

**What MouseBase does:**
- Store memories with metadata, importance scores, confidence levels
- Hybrid search: semantic (vector embeddings) + keyword (tsvector/tsquery) + recency + importance — all weighted
- Version history: every update creates a snapshot, you can restore to any previous version
- Lifecycle management: soft-delete, archive, restore, auto-expiry, hard-delete after retention period
- Provenance tracking: know where each memory came from (API, import, conversation, enrichment)
- Relationships: supersedes, contradicts, derived_from, duplicate_of
- Built-in rate limiting per plan, usage tracking, billing via Razorpay

**Tech stack:**
- FastAPI + SQLAlchemy + PostgreSQL (with pgvector)
- Vercel frontend (React/TypeScript)
- Neon serverless Postgres
- Render free tier backend

**SDKs:**
- Python: `pip install mousebase` (v0.3.4)
- JavaScript/TypeScript: `npm install mousebase` (v0.1.10)
- Framework integrations: LangChain, LlamaIndex, CrewAI, OpenAI Agents, Mastra

**Try it:**
```
pip install mousebase
```
```python
from mousebase import MouseBase

client = MouseBase(api_key="your-key")
client.remember(content="User prefers dark mode", metadata={"context": "preferences"})
results = client.search(query="what does the user prefer?")
```

Free tier: 5,000 memories, 500 searches/hour.

Would love feedback on the search quality and the API design.
