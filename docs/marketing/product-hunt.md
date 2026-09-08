# Product Hunt Launch Assets

**Product Name:** MouseBase

**Tagline:** Persistent memory infrastructure for AI agents

**Description:**
MouseBase is a hosted API that gives AI agents persistent memory. Unlike vector databases that handle RAG, MouseBase provides versioning, lifecycle management, and multi-signal search designed specifically for agent memory.

**Features:**
- Hybrid search: semantic + keyword + recency + importance
- Version history with restore capability
- Lifecycle management: soft-delete, archive, auto-expiry
- Provenance tracking and relationships
- Python and JavaScript SDKs
- Framework integrations: LangChain, LlamaIndex, CrewAI, OpenAI Agents, Mastra

**Pricing:**
- Free: 5,000 memories, 500 searches/hour
- Developer: $19/mo (25,000 memories, 1,000 searches/hour)
- Pro: $79/mo (250,000 memories, 5,000 searches/hour)

**URL:** https://mousebase.dev

**Maker Comment:**
Hey Product Hunt! I built MouseBase because I was frustrated with how AI agents handle memory. Every new conversation starts from scratch. Vector databases are great for RAG but they're not designed for agent memory — no versioning, no lifecycle management, no search that actually works.

MouseBase gives agents persistent memory with hybrid search (semantic + keyword + importance + recency), version history, and lifecycle management. It's 5 lines of code to get started.

Free tier: 5,000 memories, 500 searches/hour. No credit card required.

Would love feedback on the search approach and API design!
