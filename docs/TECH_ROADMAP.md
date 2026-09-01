# MouseBase Roadmap

> "Before getting users, make sure the infrastructure is solid."

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
- SEO: robots.txt, JSON-LD, sitemap, llms.txt, Open Graph, per-page meta tags

### What's Not Live
- Memory types (fact, preference, conversation, etc.) — currently flat `{content, metadata}`
- Auto-tagging
- Memory relationships
- Hybrid search (vector + BM25)
- Memory lifecycle (TTL, versioning, archive)
- Collections (hierarchical organization)
- Bulk import from external sources

---

## Phase 0 — Infrastructure Hardening (Pre-Launch)

### Monitoring & Observability
- [x] Render logs — available via Render dashboard
- [x] **Sentry** — `sentry_sdk` installed, initialized in lifespan when `SENTRY_DSN` env var is set. Traces sample rate 0.1, PII disabled.
- [ ] **BetterStack / UptimeRobot** — external uptime monitoring + status page
- [x] **Structured logging** — `structlog` configured. JSON output in production, colorized console in development.
- [x] **Request IDs** — `RequestIDMiddleware` generates `X-Request-ID` on every request.

### Security
- [x] **Email verification** — token-based with 24-hour expiry
- [x] **Password reset** — token-based with 1-hour expiry, invalidates all sessions
- [x] **JWT refresh tokens** — 15 min access + 30 day refresh, rotation on use
- [x] **Session management** — list, revoke single, revoke all
- [x] **Rate limiting** — 60 req/min per IP, plan-based hourly limits
- [x] **Security headers** — HSTS, XFO, XSS, Referrer-Policy, Permissions-Policy
- [x] **Hardcoded secrets removed** — API keys no longer in codebase or CI
- [x] **Dynamic CI key generation** — bootstrap script generates valid keys, CI exports for tests
- [ ] **Secret rotation** — automated API key + JWT secret rotation schedule

### Reliability
- [ ] **Automated backups** — daily DB dumps with retention policy
- [x] **Database indexes** — 13 indexes across all tables
- [x] **Connection pooling** — pool_size=20, max_overflow=10, pool_pre_ping=True
- [x] **Health endpoints** — `GET /health/` with DB check + latency
- [x] **Graceful startup/shutdown** — FastAPI lifespan context manager

### Billing & Payments
- [x] **Razorpay integration** — one-time orders, plan upgrades, addons
- [x] **Webhook processing** — payment.captured, subscription.cancelled, subscription.charged
- [x] **Invoice generation** — Razorpay receipt URL with fallback to branded printable invoice
- [x] **Plan enforcement** — memory, project, and rate limits enforced
- [x] **No-subscription fallback** — users without subscription get FREE plan limits (not unlimited)
- [x] **Project.plan sync** — subscription upgrades/cancels now update project.plan
- [x] **Webhook error handling** — failed handlers re-raise so Razorpay retries
- [x] **Dashboard reads subscription** — plan shown from Subscription table, not stale project.plan
- [x] **Monthly search limit** — enforced via billing-usage endpoint

---

## Phase 0.5 — Memory Explorer

- [x] **Memory list** — paginated table with columns: Content, External ID, Created, Updated
- [x] **Search & filter** — filter by content, external ID, metadata, date range
- [x] **Memory inspector** — full detail view with JSON, timestamps, similarity history
- [x] **Table customization** — show/hide/reorder columns
- [x] **Bulk operations** — select → delete, export, move, add metadata
- [x] **Export** — JSON, CSV, NDJSON
- [x] **Analytics** — per-project stats: total memories, storage, top external IDs, top metadata keys
- [x] **Timeline** — activity feed (Remember/Search/Patch/Delete events)

---

## Phase 1 — Memory Types

Replace the uniform `{content, metadata}` model with typed memories:

| Type | Description | Example |
|---|---|---|
| `fact` | Immutable truth | "The sky is blue" |
| `preference` | User preference | "I prefer Rust over Go" |
| `conversation` | Dialogue turn | "User asked about Python" |
| `document` | Long-form text | PDF/Notion import |
| `knowledge` | Structured knowledge | "E=mc^2" |
| `observation` | Observed behavior | "User visits docs at 2pm daily" |
| `task` | Action item | "Deploy v2 by Friday" |

Each type carries its own schema and validation rules.

---

## Phase 2 — Automatic Tagging

Auto-generate tags on every memory:

```json
{
  "content": "I prefer Rust over Go",
  "type": "preference",
  "tags": {
    "languages": ["Rust", "Go"],
    "category": "programming",
    "sentiment": "positive",
    "entities": []
  }
}
```

Tag sources:
- **Language detection** — programming languages, spoken languages
- **Framework detection** — React, FastAPI, PyTorch, etc.
- **Entity extraction** — people, companies, products, locations
- **Topic classification** — ML, web dev, devops, design
- **User attribution** — which user/project owns it

---

## Phase 3 — Memory Relationships

Allow memories to reference each other:

```
Memory A (OpenAI)
  ├── relates_to → Memory B (GPT-5)
  ├── depends_on → Memory C (API Key)
  └── parent_of  → Memory D (Chat History)
```

Relationship types:
- `relates_to` — generic association
- `depends_on` — prerequisite
- `parent_of` / `child_of` — hierarchy
- `references` — citation
- `duplicates` — dedup marker
- `conflicts_with` — contradiction tracking

---

## Phase 4 — Hybrid Search

**Current**: Vector search only
**Future**:
```
Score = α * vector_similarity
      + β * keyword_relevance  (BM25 / FTS)
      + γ * metadata_match
      + δ * recency_boost
```

Ranking factors:
- `relevance` — semantic similarity to query
- `freshness` — newer results rank higher
- `importance` — user-defined priority, view count, link count
- `usage_frequency` — how often a memory is retrieved

---

## Phase 5 — Memory Lifecycle

Instead of storing forever:

| Operation | Behavior |
|---|---|
| `replace` | Overwrite content, preserve id/relationships |
| `merge` | Combine with existing, keep both histories |
| `archive` | Soft delete, exclude from search by default |
| `expire` | TTL-based auto-removal |
| `version` | Track edit history, rollback support |

---

## Phase 6 — Collections

Hierarchical organization:

```
Workspace
  └── Project
       └── Collection
            └── Memories
```

- Collections are user-defined folders/namespaces
- Memories belong to exactly one collection (or root project)
- Search can scope to workspace, project, or collection

---

## Phase 7 — Bulk Import

Support importing from external sources:

| Source | Format |
|---|---|
| CSV | `content, type, tags, ...` |
| JSON | Array of memory objects |
| Markdown | Headers → titles, paragraphs → memories |
| PDF | Extract text, chunk by page/section |
| Notion | Export → HTML/Markdown |
| Slack | Channel export → conversations |

---

## Testing & Quality

### Test Coverage Needed
- [ ] Cross-project access isolation tests
- [ ] Cross-user access isolation tests
- [ ] API key rotation tests
- [ ] Refresh token replay prevention tests
- [ ] Memory deletion propagation tests
- [ ] Export functionality tests
- [ ] Rate limit enforcement tests
- [ ] CI generates ephemeral credentials per run (done — bootstrap generates key)

### API Examples
- [x] Centralize API base URL in playground (uses `VITE_API_URL`)
- [ ] Automated test verifying all generated examples use canonical API origin
- [ ] Ensure Python and JavaScript quickstarts are copy-paste ready

---

## SEO & Discoverability

### Done
- [x] Fix robots.txt for OAI-SearchBot and AI crawlers
- [x] Fix GitHub links (anomalyco → Lumine8)
- [x] Add JSON-LD structured data (SoftwareApplication, WebSite, Organization)
- [x] Update sitemap.xml (16 URLs)
- [x] Add llms.txt
- [x] Update homepage hero copy
- [x] Improve meta descriptions for Blog, Changelog, Roadmap

### Still TODO
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools
- [ ] Inspect homepage, docs, pricing, and use-case pages in Search Console

---

## Content & Onboarding

### Knowledge Base Articles
Each article: answer query in first paragraph, descriptive H2 headings, runnable example, trade-offs, SDK/API links, author/date/last-updated.

**Category Education**
- [ ] "What Is Persistent Memory for AI Agents?"
- [ ] "Long-Term Memory vs RAG vs Context Window"
- [ ] "Semantic, Episodic, and Procedural Memory for Agents"

**Implementation Guides**
- [ ] "How to Add Persistent Memory to a Python Agent"
- [ ] "PostgreSQL + pgvector Memory Store Tutorial"
- [ ] "Memory Namespaces for Multi-Tenant AI Apps"

**Evaluation**
- [ ] "How to Evaluate AI Agent Memory Retrieval"
- [ ] "Memory Precision, Recall, Freshness, and Latency"
- [ ] "When Semantic Search Fails for Agent Memory"

**Comparisons**
- [ ] "MouseBase vs Redis for AI Memory"
- [ ] "MouseBase vs a Vector Database"
- [ ] "Hosted Memory API vs Self-Hosted pgvector"

**Use Cases**
- [ ] "Persistent Memory for Customer Support Agents"
- [ ] "Memory for RAG Applications"
- [ ] "Memory for Coding Agents"
- [ ] "Memory for Discord Bots"

**Trust & Governance**
- [ ] "How to Delete AI Memories Reliably"
- [ ] "Tenant Isolation for Agent Memory"
- [ ] "Sensitive Data and AI Memory Retention"

### Onboarding
- [ ] One canonical quickstart: create project → store memory → search → delete (under 5 min)
- [ ] Runnable examples in Python and JavaScript
- [ ] Three proof points below hero: working 5-min quickstart, public retrieval benchmark, transparent security page

---

## Growth & Developer Attention

### Design Partners
- [ ] Recruit 5–10 design partners building real agents
- [ ] Target at least 3 use cases with repeat usage
- [ ] Collect evidence of reduced prompt/context work

### Positioning
- [ ] Reframe as: "Operational memory infrastructure for production AI agents"
- [ ] Emphasize: scoped, inspectable, evaluable, easy to delete
- [ ] Avoid "just another vector database" framing

### Developer Attention Strategy
- [ ] Publish open-source benchmark repository (dataset, eval script, baseline + MouseBase results)
- [ ] Share on Hacker News, Reddit (r/LocalLLaMA, r/MachineLearning), GitHub Discussions
- [ ] Create canonical starter templates: LangGraph, OpenAI Agents SDK, LlamaIndex, CrewAI, FastAPI/Node
- [ ] Each template: one-command setup, deployed demo, architecture diagram, docs link
- [ ] Public changelog and roadmap with dates, version numbers, breaking-change policy
- [ ] "Memory inspector" demo with synthetic data

### Benchmarks & Evidence
- [ ] Publish retrieval benchmarks with methodology
- [ ] Publish latency benchmarks across plans
- [ ] Document real-world usage patterns from design partners

---

## Measurement Plan

| Metric | Baseline | Target |
|--------|----------|--------|
| Indexed pages | Search Console coverage report | 100% of intended public pages indexed |
| Branded discovery | Queries containing "MouseBase" | Increasing impressions/clicks month over month |
| Non-branded discovery | "AI agent memory", "persistent memory API" | 10+ pages receiving impressions |
| AI citations | Manual search in ChatGPT, Google AI, Copilot | Baseline of cited pages; improve docs/benchmark representation |
| Developer conversion | Docs → SDK install → API request → retained project | Instrument each step; reduce largest drop-off |
| Content quality | Time on page, scroll depth, code-copy events | Pages attracting qualified developers |
| Product proof | Quickstart success rate, API p50/p95 latency | Publish reproducible evidence |
