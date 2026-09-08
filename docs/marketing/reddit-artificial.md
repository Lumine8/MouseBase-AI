# Reddit Post for r/artificial

**Title:** Persistent memory infrastructure for AI agents – looking for feedback

**Post:**

I've been building MouseBase (https://mousebase.dev) — a hosted API that gives AI agents persistent memory.

The core problem: AI agents forget everything between sessions. Vector databases handle RAG well but aren't designed for agent memory — they lack versioning, lifecycle management, and multi-signal search.

**What MouseBase provides:**
- Hybrid search: 50% semantic, 20% keyword, 15% importance, 10% metadata, 5% recency
- Version history: automatic snapshots on every update, restore to any version
- Lifecycle management: soft-delete, archive, auto-expiry, hard-delete after 30-day retention
- Provenance tracking: source (API, import, conversation, enrichment), confidence scores
- Relationships: supersedes, contradicts, derived_from, duplicate_of
- Rate limiting, usage tracking, billing

**Integrations:**
- LangChain, LlamaIndex, CrewAI, OpenAI Agents, Mastra
- Python: `pip install mousebase`
- JavaScript: `npm install mousebase`

**Current status:**
- Live at https://mousebase.dev
- Free tier: 5,000 memories, 500 searches/hour
- OpenAPI spec available at https://api.mousebase.dev/openapi.json

Looking for feedback on the architecture and search approach. What would you want from an agent memory layer?
