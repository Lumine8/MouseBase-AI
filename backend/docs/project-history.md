# MouseBase — Project History

## Overview

Persistent memory infrastructure for AI applications. Semantic memory storage/retrieval via REST API and Python SDK, backed by PostgreSQL + pgvector.

- **Repo:** `github.com/Lumine8/MouseBase-AI`
- **Stack:** FastAPI + React 18 + PostgreSQL 16 + pgvector

---

## What's Been Done

### Foundation

- FastAPI backend with modular router/service/model structure
- Async SQLAlchemy with pgvector for vector embeddings
- React 18 SPA with Vite, TypeScript, React Router v6
- Docker Compose (postgres + api) and GitHub Actions CI
- Alembic migrations pipeline with idempotent `DO $$ IF NOT EXISTS` blocks

### Authentication & Security

- Dual auth: JWT for dashboard, API keys (`mb_live_xxx_yyy`) for programmatic access
- API keys hashed (Argon2) and encrypted (Fernet) at rest
- Four auth dependency functions: `get_current_user`, `get_current_user_jwt_only`, `get_current_project`, `get_current_user_or_project`
- Redis-based sliding window rate limiter (graceful degradation when Redis is down)

### Database Schema (9 migrations)

| Migration | Changes |
|-----------|---------|
| `81b73c131bd8` | Initial: `users`, `projects`, `memories`, `embeddings` + pgvector |
| `2a3b4c5d6e7f` | Add `plan` column to projects |
| `4a5b6c7d8e9f` | `subscriptions`, `payments`, `webhook_events` tables |
| `5a6b7c8d9e0f` | Fix missing billing columns |
| `b08889e1dda0` | `last_used_at` on projects, `api_keys` table |
| `d3fee61ccd7b` | `api_key_encrypted` on projects |
| `3ec9751287fe` | `full_name`, `avatar_url`, `email_verified`, `last_login` on users |
| `113c31deb105` | `status` (ACTIVE/DISABLED/ARCHIVED) on projects |
| `583aafa764cc` | `usage` table for daily metrics |

Chain: `81b73c131bd8 → 2a3b4c5d6e7f → 4a5b6c7d8e9f → 5a6b7c8d9e0f → d3fee61ccd7b → b08889e1dda0 → 3ec9751287fe → 113c31deb105 → 583aafa764cc`

### API Endpoints (all under `/api/v1`)

- **Auth:** signup, login, verify-email, me
- **Remember:** POST `/remember/` — store a memory
- **Search:** POST `/search/` — semantic search with cosine distance
- **Memory:** GET/PATCH/DELETE `/memory/{id}`
- **Projects:** CRUD `/projects/`, rotate key, view API key
- **Dashboard:** GET `/dashboard/metrics`, GET `/dashboard/analytics` (7-day daily usage + totals)
- **Payments:** plans, orders, verification, webhooks, subscription, billing history, addons

### Embeddings

- Two providers: Gemini (default, with local hash-based fallback) and OpenAI
- Abstract `EmbeddingService` interface
- Configurable model and dimensions (default: 3072)
- `MIN_SCORE` threshold (0.65) for search relevance

### Subscriptions & Billing

- Six plans: FREE → DEVELOPER → PRO → TEAM_5 → TEAM_10 → ENTERPRISE
- Razorpay payment gateway integration
- Addon system for extra capacity
- Plan hierarchy prevents downgrades
- Webhook handling with idempotency

### Frontend

- 12 pages: Landing, Login, Signup, Dashboard, Projects, ProjectDetail, Search, Playground, Analytics, Settings, Pricing, Documentation
- 6 components: Sidebar, Navbar, PublicNav, SearchBox, MemoryTable, ApiKeyModal
- Protected routes, dark/light theme, responsive layout
- Analytics page fetches real data from `/dashboard/analytics` with Recharts
- "M" logo branding, inline `--accent` color throughout

### Recent Cleanup

- Removed duplicate + redundant migrations
- Removed docs, examples, SDK, debug scripts from push
- Fixed all ruff lint errors
- Fixed React `style` prop (object vs string)
- Fixed sidebar responsive: `data-open` → `open` class, overlay always rendered
- Mobile navbar hides GitHub and bell icons below 480px

---

## Reproducibility

```bash
# Backend
uv sync
alembic upgrade head
ruff check .
pytest -vv

# Frontend
npm install
npm run dev
```
