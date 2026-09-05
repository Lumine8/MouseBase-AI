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
- Memory Explorer (paginated list, search/filter, inspector, bulk ops, export, analytics, timeline)
- Project management with API key rotation
- Authentication (signup, login, email verification, password reset, session management)
- Billing (Razorpay — Free/Hobby/Pro plans, addons, webhooks, invoice generation)
- Public stats endpoint (`/stats/downloads`)
- Python SDK, JavaScript SDK, Browser SDK, CLI
- Framework integrations: LangChain, LlamaIndex, OpenAI Agents, MCP Server, CrewAI, Mastra
- Framework adapters: Next.js, Express, NestJS, Cloudflare Workers, Deno, Bun
- SEO: robots.txt, JSON-LD, sitemap, Open Graph, per-page meta tags

### What's Not Live
- Hybrid search (vector + BM25 + metadata + recency)
- Memory lifecycle (TTL, archive, soft-delete, versioning)
- Optional memory type field
- Operational relationships (supersedes, contradicts, derived_from, duplicate_of)
- Provenance and confidence metadata
- External uptime monitoring and status page
- Automated database backups
- Automated secret rotation

---

## Three Product Layers

| Layer | Product Promise | Priority |
|-------|----------------|----------|
| **Reliable memory substrate** | Store, search, inspect, update, archive, and delete scoped memories safely. | Immediate |
| **Intelligent retrieval and lifecycle** | Return the right memory using semantic, keyword, metadata, recency, importance, and retention signals. | Next |
| **Automated memory intelligence** | Extract, deduplicate, reconcile, relate, and import memories with explainability and cost controls. | Later, after usage evidence |

---

## Stage 0 — Release Hardening

Before broad community promotion, complete these reliability and trust requirements.

### Monitoring
- [x] Render logs — available via Render dashboard
- [x] **Sentry** — error tracking, 0.1% sample rate, PII disabled
- [x] **Structured logging** — `structlog`, JSON in production, colorized in dev
- [x] **Request IDs** — `X-Request-ID` on every request
- [ ] **External uptime monitoring** — BetterStack or UptimeRobot with public status page. A memory service needs visible availability and incident communication.

### Security
- [x] Email verification — token-based, 24-hour expiry
- [x] Password reset — token-based, 1-hour expiry, invalidates all sessions
- [x] JWT refresh tokens — 15 min access + 30 day refresh, rotation on use
- [x] Session management — list, revoke single, revoke all
- [x] Rate limiting — 60 req/min per IP, plan-based hourly limits
- [x] Security headers — HSTS, XFO, XSS, Referrer-Policy, Permissions-Policy
- [x] Hardcoded secrets removed from codebase and CI
- [x] Dynamic CI key generation — bootstrap script generates valid keys
- [ ] **Secret rotation** — automated API key rotation; JWT signing secret rotation with overlapping verification window so active sessions are not broken

### Reliability
- [x] **Automated backups** — daily DB dumps via GitHub Actions, 30-day retention, integrity verification. Restore testing still needed.
- [x] Database indexes — 13 indexes across all tables
- [x] Connection pooling — pool_size=20, max_overflow=10, pool_pre_ping=True
- [x] Health endpoints — `GET /health/` with DB check + latency
- [x] Graceful startup/shutdown — FastAPI lifespan

### Billing
- [x] Razorpay integration — one-time orders, plan upgrades, addons
- [x] Webhook processing — payment.captured, subscription.cancelled, subscription.charged
- [x] Invoice generation — Razorpay receipt URL with branded fallback
- [x] Plan enforcement — memory, project, and rate limits enforced
- [x] No-subscription fallback — FREE plan limits applied (not unlimited)
- [x] Project.plan sync — subscription changes update project.plan
- [x] Webhook error handling — failed handlers re-raise so Razorpay retries
- [x] Dashboard reads subscription — plan from Subscription table, not stale project.plan

### Testing (release-blocking)
- [x] Cross-project access isolation tests
- [x] Cross-user access isolation tests
- [x] API key rotation tests
- [x] Refresh token replay prevention tests
- [x] Memory deletion propagation tests
- [x] Export functionality tests
- [x] Rate limit enforcement tests
- [x] CI generates ephemeral credentials per run

### SDK Examples
- [x] Centralize API base URL in playground
- [ ] Automated test verifying all generated examples use canonical API origin
- [ ] Copy-paste validation for all Python and JavaScript quickstarts

---

## Stage 1 — Retrieval and Lifecycle Core

The highest-value near-term features. This stage gives MouseBase a meaningful product advantage while preserving the simple API.

### Hybrid Search

Vector-only search is a weak long-term differentiator. Developers need exact retrieval for names, package versions, ticket IDs, URLs, error messages, and code identifiers — plus semantic retrieval for paraphrases.

**Ranking formula:**
```
final_score =
    0.60 * semantic_score
  + 0.25 * keyword_score  (BM25 / full-text)
  + 0.10 * metadata_match
  + 0.05 * recency_or_importance_score
```

Weights are internal first, evaluated on a fixed dataset, not hard-coded as product truth.

- [ ] Add PostgreSQL full-text search (tsvector / tsquery) alongside pgvector
- [ ] Combine semantic + keyword scores with configurable weights
- [ ] Metadata filter API (exact match, contains, range)
- [ ] Recency weighting (newer memories rank higher, configurable decay)
- [ ] Importance field (user-defined, affects ranking)
- [ ] Deterministic tie-breaking (by created_at, then id)
- [ ] Public evaluation suite with fixed dataset

**What this solves:** exact names, IDs, code symbols, error messages, recent preferences that embeddings miss.

### Memory Lifecycle

Users are more likely to experience problems with stale, duplicated, contradictory, or undeletable memories than with a missing label.

| Capability | Behavior |
|---|---|
| `active` | Included in normal retrieval. |
| `archived` | Retained for audit/history, excluded by default. |
| `expired` | Automatically excluded and removed according to TTL policy. |
| `deleted` | Hidden immediately, removed according to documented deletion guarantees. |
| `superseded` | Linked to a newer memory, excluded or down-ranked. |
| `version` | Every update has a recoverable history and timestamp. |

- [ ] `expires_at` field — TTL-based auto-removal (background worker)
- [ ] Archive endpoint — soft delete, exclude from search by default
- [ ] Restore endpoint — un-archive a memory
- [ ] Soft-delete — hidden immediately, hard-delete after retention period
- [ ] Version history — every update creates a versioned snapshot
- [ ] Explicit replace/merge semantics on update
- [ ] Delete freshness measurement (how fast does a deleted memory disappear from search results?)

### Provenance & Confidence

Add fields only where their semantics are clear and they affect retrieval or governance.

- [ ] `source` field — where the memory came from (api, import, enrichment, etc.)
- [ ] `confidence` field — float 0-1, how certain the system is about this memory
- [ ] `importance` field — user-defined priority, affects ranking
- [ ] `supersedes_id` field — links to the memory this one replaces

### Metadata Filters

- [ ] Filter by `type`, `source`, `confidence`, `importance`, `created_at`, `updated_at`, `expires_at`
- [ ] Filter by arbitrary metadata key-value pairs
- [ ] Combine filters with AND/OR logic

---

## Stage 2 — Lightweight Semantic Structure

Add optional structure without rigid schemas or mandatory categories.

### Optional Memory Type

Do not enforce a closed taxonomy. Different applications want different concepts: `customer_fact`, `workflow_state`, `tool_result`, `instruction`, `entity`, `decision`. Allow custom types.

```json
{
  "content": "I prefer Rust over Go",
  "type": "preference",
  "metadata": {
    "category": "programming",
    "confidence": 0.94,
    "source": "conversation"
  }
}
```

- [ ] Optional `type` field on memory creation/update
- [ ] Reserved types: `fact`, `preference`, `conversation`, `task`, `document`
- [ ] Custom types accepted (any string)
- [ ] Retrieval can filter/boost by type
- [ ] Missing type never prevents storage

### Operational Relationships

Begin with relationships that solve real memory problems. Not a general knowledge graph.

| Edge | Use |
|---|---|
| `supersedes` | A newer preference or fact replaces an older one. |
| `contradicts` | Two memories cannot both be trusted without resolution. |
| `derived_from` | A summary or extracted fact points to its source. |
| `duplicate_of` | Duplicate writes can be collapsed or down-ranked. |

- [ ] `relationship` field on memory (optional, one of the 4 edges)
- [ ] `related_memory_id` field — the target of the relationship
- [ ] Expose relationships in Memory Inspector and audit trail
- [ ] Search can exclude `duplicate_of` and `superseded` memories by default
- [ ] No arbitrary user-defined graph edges yet

### Memory Inspector Improvements

- [ ] Show why a memory was returned (which signal matched: semantic, keyword, metadata, recency)
- [ ] Show which memory supersedes it (if any)
- [ ] Show version history
- [ ] Show provenance chain (derived_from links)

---

## Stage 3 — Optional Intelligence

Opt-in per project, observable, budget-limited, reversible. The system should suggest changes before it automatically applies them.

### Async Auto-Tagging

Never on the critical write path. Increases latency, cost, false positives, and privacy concerns.

- [ ] Enrichment mode: `enrichment="async"` or separate enrichment job
- [ ] Tags stored with source, model/version, confidence, timestamp, processing status
- [ ] User can re-run enrichment after changing models
- [ ] Never silently mutate customer memory content
- [ ] Low-confidence tags not treated as facts
- [ ] User can disable enrichment per project

### Deduplication & Conflict Detection

- [ ] Suggest duplicate detection on write (async, not blocking)
- [ ] Flag contradictions between memories
- [ ] Suggest supersession when a newer memory contradicts an older one
- [ ] All suggestions are opt-in, user confirms before applying

### Summarization & Extraction

- [ ] Optional memory summarization (async)
- [ ] Entity extraction (people, companies, products)
- [ ] Topic classification
- [ ] All with provenance, confidence, and cost tracking

---

## Stage 4 — Ecosystem Expansion

Selective investment. Avoid maintaining every adapter until usage data shows demand.

### Integrations

Keep the highest-value integrations:
- [x] LangChain
- [x] LlamaIndex
- [x] OpenAI Agents
- [x] MCP Server
- [ ] LangGraph (template repository)
- [ ] Plain REST/FastAPI path

Defer until demand:
- CrewAI, Mastra, other framework adapters → use template repository instead

### Import

Start with robust JSON/NDJSON (universal, deterministic). Build others only when a design partner requests one.

- [ ] JSON/NDJSON import endpoint (already have export, add import)
- [ ] Validation, dedup, and provenance tagging on import
- [ ] Notion, Slack, PDF, CSV → only after design partner demand

---

## Stage 5 — Advanced Graph & Enterprise

After evidence of sustained usage and a clear buyer.

- [ ] Arbitrary user-defined relationship edges
- [ ] Hierarchical collections (only if namespaces + metadata prove insufficient)
- [ ] Multi-hop graph retrieval
- [ ] Advanced policy engines
- [ ] Regional data residency
- [ ] Enterprise administration (SSO, audit logs, team management)

---

## SEO & Content

### Done
- [x] robots.txt for AI crawlers
- [x] JSON-LD structured data
- [x] sitemap.xml (16 URLs)
- [x] Open Graph, per-page meta tags
- [x] GitHub links fixed
- [x] Hero copy updated

### Still TODO
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools
- [ ] Inspect pages in Search Console
- [ ] Content quality > special AI files (llms.txt is nice but not a priority)

### Knowledge Base Articles
Each article: answer query in first paragraph, descriptive H2 headings, runnable example, trade-offs, SDK/API links, author/date/last-updated.

**Priority 1 — Implementation**
- [ ] "How to Add Persistent Memory to a Python Agent"
- [ ] "How to Add Persistent Memory to a JavaScript Agent"

**Priority 2 — Evaluation**
- [ ] "How to Evaluate AI Agent Memory Retrieval"
- [ ] "Memory Precision, Recall, Freshness, and Latency"

**Priority 3 — Comparisons**
- [ ] "MouseBase vs Redis for AI Memory"
- [ ] "MouseBase vs Self-Hosted pgvector"

**Priority 4 — Education**
- [ ] "What Is Persistent Memory for AI Agents?"
- [ ] "Long-Term Memory vs RAG vs Context Window"

---

## Growth

### Design Partners
- [ ] Recruit 5–10 design partners building real agents
- [ ] Target at least 3 use cases with repeat usage
- [ ] Collect evidence of reduced prompt/context work

### Positioning
- "Operational memory infrastructure for production AI agents"
- Emphasize: scoped, inspectable, evaluable, easy to delete
- Avoid "just another vector database" framing

### Benchmarks & Evidence
- [ ] Publish retrieval benchmark (vector-only vs hybrid) with methodology
- [ ] Publish latency benchmarks (p50/p95) across plans
- [ ] Publish delete/archive freshness measurements
- [ ] Document real-world usage patterns from design partners

### Developer Attention
- [ ] Open-source benchmark repository (dataset, eval script, baseline + MouseBase results)
- [ ] Share on Hacker News, Reddit, GitHub Discussions
- [ ] Canonical starter templates: LangGraph, OpenAI Agents, LlamaIndex, FastAPI/Node
- [ ] Public changelog with version numbers and breaking-change policy

---

## Measurement Plan

### Product Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Hybrid vs vector precision@5 | Vector-only baseline | +15% improvement |
| p50 latency | Current vector-only | < 100ms for hybrid |
| p95 latency | Current vector-only | < 300ms for hybrid |
| Delete freshness | Unknown | < 60 seconds from API call to search exclusion |
| Archive freshness | Unknown | < 60 seconds from API call to search exclusion |

### Business Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Indexed pages | Search Console | 100% of intended pages |
| Branded discovery | Queries for "MouseBase" | Growing month over month |
| Developer conversion | Docs → SDK → API request → retained project | Instrument each step |
| Quickstart success rate | Unknown | > 80% complete without help |
