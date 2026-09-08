# Reddit Post for r/SideProject

**Title:** I built a memory layer for AI agents – MouseBase

**Post:**

Hey everyone,

I've been working on MouseBase (https://mousebase.dev) — a hosted API that gives AI agents persistent memory.

**Why I built this:**
I was building AI agents and kept hitting the same wall: every new conversation, the agent forgets everything. Vector databases are great for RAG but they're not designed for memory — no versioning, no lifecycle management, no search that actually works.

**What it does:**
- Store memories with metadata, importance scores, confidence levels
- Hybrid search: semantic + keyword + recency + importance (all weighted)
- Version history: every update creates a snapshot, restore to any previous version
- Lifecycle: soft-delete, archive, restore, auto-expiry, hard-delete after retention
- Provenance tracking: know where each memory came from
- SDKs for Python and JavaScript

**Tech stack:**
- FastAPI + SQLAlchemy + PostgreSQL (with pgvector)
- Vercel frontend
- Render free tier backend
- Neon serverless Postgres

**Pricing:**
Free tier: 5,000 memories, 500 searches/hour
Paid plans scale up from there

**What I'd love feedback on:**
- The search quality and API design
- Whether the free tier is generous enough
- Any features you'd want for your agents

Try it out: https://mousebase.dev
Python: `pip install mousebase`
JS: `npm install mousebase`
