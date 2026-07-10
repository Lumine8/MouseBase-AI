# MouseBase Roadmap

> "Before getting users, make sure the infrastructure is solid."

---

## Phase 0 — Infrastructure Hardening (Pre-Launch)

### Monitoring & Observability
- [x] Render logs — available via Render dashboard
- [x] **Sentry** — `sentry_sdk` installed, initialized in lifespan when `SENTRY_DSN` env var is set. Traces sample rate 0.1, PII disabled.
- [ ] **BetterStack / UptimeRobot** — external uptime monitoring + status page
- [x] **Structured logging** — `structlog` configured. JSON output in production, colorized console in development. Fields: timestamp, level, logger, request_id via contextvars.
- [x] **Request IDs** — `RequestIDMiddleware` generates `X-Request-ID` on every request, reads existing header if provided by client. Stored in `request.state.request_id` and propagated through logs.

### Security
- [x] **Email verification** — `POST /auth/signup` generates verification token, sends email with link. `POST /auth/verify-email` verifies token. `POST /auth/resend-verification` resends. Auto-verified in development mode.
- [x] **Password reset** — `POST /auth/forgot-password` sends email with 1-hour expiry link. `POST /auth/reset-password` accepts token + new password.
- [x] **JWT refresh tokens** — Short-lived access tokens (15 min default) + long-lived refresh tokens (30 day default). `POST /auth/refresh` exchanges refresh token for new access + refresh pair. Refresh tokens are one-time use (rotated on each refresh).
- [x] **Session management** — `GET /auth/sessions` lists active sessions with user_agent, ip_address, last_used. `DELETE /auth/sessions/{id}` revokes specific session. `DELETE /auth/sessions` revokes all sessions (sign out everywhere).
- [x] **Rate limiting everywhere** — `slowapi` integrated. Default: 60 requests/minute per IP. Disabled in development. Configurable per-endpoint with `@limiter.limit()`.
- [ ] **Secret rotation** — automated API key + JWT secret rotation schedule
- [x] **Security headers** — Middleware sets: `Strict-Transport-Security` (max-age=31536000, includeSubDomains), `X-Content-Type-Options` (nosniff), `X-Frame-Options` (DENY), `X-XSS-Protection`, `Referrer-Policy` (strict-origin-when-cross-origin), `Permissions-Policy` (no camera/mic/geo).

### Reliability
- [ ] **Automated backups** — daily DB dumps with retention policy
- [x] **Database indexes** — Migration adds: `ix_users_email`, `ix_users_created_at`, `ix_projects_owner_id`, `ix_projects_owner_created`, `ix_memories_project_id`, `ix_memories_created_at`, `ix_memories_project_created`, `ix_memories_external_id` (partial), `ix_embeddings_memory_id`, `ix_usage_project_date`, `ix_refresh_tokens_user_id`, `ix_refresh_tokens_active`, `ix_sessions_user_id`.
- [x] **Connection pooling** — `create_async_engine` tuned: pool_size=20, max_overflow=10, pool_pre_ping=True, pool_recycle=3600.
- [x] **Health endpoints** — `GET /health/` checks database connectivity, returns `{"status": "healthy"/"degraded", "checks": {"database": {"status": "up"/"down", "latency_ms": ...}}}`.
- [x] **Graceful startup/shutdown** — FastAPI `lifespan` context manager: initializes logging, starts Sentry, checks DB on boot; disposes engine connections on shutdown.

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

Instead of an empty `metadata {}`, auto-generate tags on every memory:

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

## Current State (as of this document)

### Phase 0 — Done
- [x] Sentry integration (wired, needs DSN env var)
- [x] Structured JSON logging (structlog)
- [x] Request IDs on every request
- [x] Security headers (HSTS, XFO, XSS, Referrer-Policy, Permissions-Policy)
- [x] Rate limiting (slowapi, 60/min default, disabled in dev)
- [x] Health endpoint (`GET /health/` with DB check + latency)
- [x] Graceful startup/shutdown (lifespan events)
- [x] Connection pooling tuned (pool_size=20, max_overflow=10, pool_pre_ping)
- [x] Response timing header (`X-Response-Time-Ms`)
- [x] Email service (console in dev, SMTP in production)
- [x] JWT refresh tokens (15 min access + 30 day refresh, rotation on use)
- [x] Email verification (token on signup, verify endpoint, resend)
- [x] Password reset (forgot + reset endpoints, 1-hour expiry)
- [x] Session management (list, revoke single, revoke all)
- [x] Database indexes (13 new indexes across all tables)

### Phase 0 — Still To Do
- [ ] Secret rotation (automated schedule for JWT + API keys)
- [ ] Automated backups (Render daily DB dump)
- [ ] BetterStack / UptimeRobot (external monitoring service)

### Product — Still To Do
- **Memory model**: Flat `{content, metadata}` only
- **Search**: Vector-only
- **Tags**: None generated, empty `metadata`
- **Relationships**: None
- **Bulk import**: None

> This roadmap is the difference between a vector store and an AI memory operating system.
