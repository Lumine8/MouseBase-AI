# MouseBase Roadmap

> "Make the existing core reliable, measurable, easy to integrate, and meaningfully better than basic vector search."

---

## Current Status

### Versions
- **Python SDK**: v0.3.2 ([PyPI](https://pypi.org/project/mousebase/))
- **JavaScript SDK**: v0.1.7 ([npm](https://www.npmjs.com/package/mousebase))
- **Backend API**: v0.1.0 ([api.mousebase.dev](https://api.mousebase.dev))
- **Dashboard**: [mousebase.dev](https://mousebase.dev)

### What's Live
- Memory CRUD (remember, search, get, update, delete)
- **Hybrid search** — PostgreSQL full-text + vector + metadata + recency scoring
- Memory Explorer (paginated list, search/filter, inspector, bulk ops, export, analytics, timeline)
- Project management with API key rotation (24h grace period)
- Authentication (signup, login, email verification, password reset, session management)
- Billing (Razorpay — Free/Hobby/Pro plans, addons, webhooks, invoice generation)
- Secret rotation (JWT signing secret with `JWT_SECRET_PREVIOUS` fallback)
- Automated backups (daily pg_dump, weekly restore test verified)
- Public stats endpoint (`/stats/downloads`)
- Python SDK, JavaScript SDK, Browser SDK, CLI
- Framework integrations: LangChain, LlamaIndex, OpenAI Agents, MCP Server, CrewAI, Mastra
- Framework adapters: Next.js, Express, NestJS, Cloudflare Workers, Deno, Bun
- SEO: robots.txt, JSON-LD, sitemap, Open Graph, per-page meta tags, llms.txt

### What's Not Live
- Memory lifecycle (TTL, archive, soft-delete, versioning)
- Importance field (user-defined ranking signal)
- Deterministic tie-breaking (by created_at, then id)
- Operational relationships (supersedes, contradicts, derived_from, duplicate_of)
- Provenance and confidence metadata
- Comparison pages (MouseBase vs Mem0, vs Zep, vs vector databases)
- Educational content ("What Is Persistent Memory?", "AI Memory Architecture")
- Blog (only listing page with 2 placeholder entries)
- `.well-known/security.txt`

---

## Three Product Layers

| Layer | Product Promise | Priority |
|-------|----------------|----------|
| **Reliable memory substrate** | Store, search, inspect, update, archive, and delete scoped memories safely. | Immediate |
| **Intelligent retrieval and lifecycle** | Return the right memory using semantic, keyword, metadata, recency, importance, and retention signals. | Next |
| **Automated memory intelligence** | Extract, deduplicate, reconcile, relate, and import memories with explainability and cost controls. | Later, after usage evidence |

---

## Stage 0 — Release Hardening ✅

All items complete. See git history for implementation details.

---

## Stage 1 — Retrieval and Lifecycle Core

### 1A — Hybrid Search ✅

Ranking formula:
```
final_score =
    0.60 * semantic_score
  + 0.25 * keyword_score  (BM25 / full-text)
  + 0.10 * metadata_match
  + 0.05 * recency_score
```

- [x] PostgreSQL full-text search (tsvector / tsquery) alongside pgvector
- [x] Hybrid scoring with configurable weights
- [x] Metadata filter API (exact match via JSONB operators)
- [x] Recency weighting (exponential decay, half-life ~30 days)
- [x] search_vector auto-populated on insert/update via SQL + trigger

### 1B — Search Refinement (HIGH priority)

- [ ] Importance field — user-defined float 0-1, replaces recency when set
- [ ] Deterministic tie-breaking — sort by final_score DESC, then created_at DESC, then id ASC
- [ ] Advanced metadata filters — range queries (gt, lt, gte, lte), IN lists, nested key access

### 1C — Memory Lifecycle (HIGH priority, user-facing)

Most likely source of user pain: stale, duplicated, contradictory, or undeletable memories.

| Capability | Behavior |
|---|---|
| `active` | Included in normal retrieval. Default state. |
| `archived` | Retained for audit/history, excluded from search by default. |
| `expired` | Automatically excluded and removed according to TTL policy. |
| `deleted` | Hidden immediately, hard-deleted after retention period. |

- [ ] `expires_at` field — TTL-based auto-removal (background worker or query-time filter)
- [ ] `status` field — enum: `active`, `archived`, `deleted`
- [ ] Archive endpoint — `PATCH /memory/{id}/archive` (sets status=archived, excluded from search)
- [ ] Restore endpoint — `PATCH /memory/{id}/restore` (sets status=active)
- [ ] Soft-delete — `DELETE /memory/{id}` sets status=deleted, not hard-delete
- [ ] Hard-delete worker — removes memories with status=deleted after configurable retention (default 30 days)
- [ ] Expiry worker — queries `expires_at < now()` and marks as deleted
- [ ] Search excludes `archived` and `deleted` by default, with optional `include_archived` flag

### 1D — Provenance & Confidence (MEDIUM priority)

Add fields only where semantics are clear and they affect retrieval or governance.

- [ ] `source` field — string enum: `api`, `import`, `enrichment`, `conversation`
- [ ] `confidence` field — float 0-1, how certain the system is about this memory
- [ ] `importance` field — float 0-1, user-defined priority, affects ranking
- [ ] `supersedes_id` field — FK to the memory this one replaces
- [ ] Search ranking integrates importance: `final_score = 0.55*semantic + 0.25*keyword + 0.10*metadata + 0.10*importance`

### 1E — Version History (MEDIUM-LOW priority)

- [ ] `MemoryVersion` table — snapshots on every update (content, metadata, timestamp)
- [ ] `GET /memory/{id}/versions` — returns version history
- [ ] `PATCH /memory/{id}/restore/{version_id}` — revert to a specific version
- [ ] Search only returns latest version by default

---

## Stage 1.5 — AI Discoverability & SEO (HIGH priority, separate from product stages)

Make MouseBase discoverable by AI systems and search engines. This runs in parallel with Stage 1 product work.

### P0 — Critical (crawlability / indexing)

- [x] Create `.well-known/security.txt`
- [ ] Fix OG image — currently an SVG logo, needs a 1200x630 PNG social card
- [x] Add `twitter:site` meta tag to all pages
- [x] Update softwareVersion in JSON-LD to 0.3.2
- [x] Add `llms.txt` at `.well-known/llms.txt`
- [ ] Ensure sitemap.xml is submitted to Google Search Console and Bing Webmaster Tools

### P1 — Entity Understanding

- [ ] Consistent entity description across all surfaces: "Persistent memory infrastructure for AI applications and agents"
- [ ] Verify homepage H1, title, meta description, and first paragraph all clearly answer "What is MouseBase?"
- [ ] Verify GitHub README immediately explains what, why, who, how (currently good — verify consistency)
- [ ] Ensure package descriptions (PyPI, npm) match the canonical product description
- [ ] Add `twitter:card` summary_large_image to all public pages (not just summary)

### P2 — High-Value Content Pages

Each page: clear title, H1, answer-first structure (first paragraph answers the query), technical depth, code examples, canonical URL, structured data.

- [ ] `/what-is-mousebase` — "What is MouseBase?" (answer: persistent memory infrastructure for AI)
- [ ] `/ai-memory` — "What is AI memory?" (educational, positions MouseBase)
- [ ] `/persistent-memory-for-ai` — "Persistent memory for AI agents and applications"
- [ ] `/comparisons/mem0` — "MouseBase vs Mem0" (honest technical comparison)
- [ ] `/comparisons/zep` — "MouseBase vs Zep" (honest technical comparison)
- [ ] `/comparisons/vector-database` — "MouseBase vs vector databases" (explains the difference)
- [ ] `/blog` — fix to support individual posts (currently 2 hardcoded placeholders)
- [ ] Blog post: "How to Add Persistent Memory to an AI Agent" (Python + JS examples)

### P3 — Documentation & Authority

- [ ] Export OpenAPI/Swagger spec from FastAPI and host as static file
- [ ] Improve VitePress docs: add architecture page, data model page, security page
- [ ] Publish `llms.txt` at root AND at `.well-known/llms.txt` (currently only at root)
- [ ] Create honest comparison content (not "MouseBase is better" — "here are the tradeoffs")
- [ ] Knowledge base: "What Is Persistent Memory for AI Agents?", "Long-Term Memory vs RAG vs Context Window"

---

## Stage 2 — Lightweight Semantic Structure

Add optional structure without rigid schemas or mandatory categories.

### Optional Memory Type

- [ ] Optional `type` field on memory creation/update
- [ ] Reserved types: `fact`, `preference`, `conversation`, `task`, `document`
- [ ] Custom types accepted (any string)
- [ ] Retrieval can filter/boost by type
- [ ] Missing type never prevents storage

### Operational Relationships

- [ ] `relationship` field — enum: `supersedes`, `contradicts`, `derived_from`, `duplicate_of`
- [ ] `related_memory_id` field — FK to target memory
- [ ] Search excludes `duplicate_of` and `superseded` by default
- [ ] Expose relationships in Memory Inspector

### Memory Inspector Improvements

- [ ] Show why a memory was returned (which signal matched)
- [ ] Show which memory supersedes it (if any)
- [ ] Show version history
- [ ] Show provenance chain (derived_from links)

---

## Stage 3 — Optional Intelligence

Opt-in per project, observable, budget-limited, reversible. System suggests changes before auto-applying.

### Async Auto-Tagging
- [ ] Enrichment mode: `enrichment="async"` or separate enrichment job
- [ ] Tags stored with source, model/version, confidence, timestamp
- [ ] Never silently mutate customer memory content
- [ ] User can disable enrichment per project

### Deduplication & Conflict Detection
- [ ] Suggest duplicate detection on write (async, not blocking)
- [ ] Flag contradictions between memories
- [ ] All suggestions are opt-in, user confirms before applying

### Summarization & Extraction
- [ ] Optional memory summarization (async)
- [ ] Entity extraction (people, companies, products)
- [ ] Topic classification

---

## Stage 4 — Ecosystem Expansion

### Integrations (keep highest-value)
- [x] LangChain, LlamaIndex, OpenAI Agents, MCP Server
- [ ] LangGraph (template repository)
- [ ] JSON/NDJSON import endpoint (already have export)

### Defer until demand
- CrewAI, Mastra, other adapters → template repository instead
- Notion, Slack, PDF, CSV → only after design partner demand

---

## Stage 5 — Advanced Graph & Enterprise

After evidence of sustained usage and a clear buyer.

- [ ] Arbitrary user-defined relationship edges
- [ ] Multi-hop graph retrieval
- [ ] Regional data residency
- [ ] Enterprise administration (SSO, audit logs, team management)

---

## Growth

### Design Partners
- [ ] Recruit 5–10 design partners building real agents
- [ ] Target at least 3 use cases with repeat usage

### Benchmarks & Evidence
- [ ] Publish retrieval benchmark (vector-only vs hybrid) with methodology
- [ ] Publish latency benchmarks (p50/p95) across plans
- [ ] Publish delete/archive freshness measurements

### Developer Attention
- [ ] Open-source benchmark repository
- [ ] Share on Hacker News, Reddit, GitHub Discussions
- [ ] Canonical starter templates: LangGraph, OpenAI Agents, LlamaIndex
- [ ] Public changelog with version numbers

---

## Measurement Plan

### Product Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Hybrid vs vector precision@5 | Vector-only baseline | +15% improvement |
| p50 latency | Current vector-only | < 100ms for hybrid |
| p95 latency | Current vector-only | < 300ms for hybrid |
| Delete freshness | Unknown | < 60 seconds from API call to search exclusion |

### Business Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Indexed pages | Search Console | 100% of intended pages |
| Branded discovery | Queries for "MouseBase" | Growing month over month |
| Developer conversion | Docs → SDK → API request → retained project | Instrument each step |
| Quickstart success rate | Unknown | > 80% complete without help |
