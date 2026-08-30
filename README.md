<div align="center">
  <img src="frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="120" />
  <br /><br />
  <p><strong>Persistent memory infrastructure for AI agents.</strong></p>
  <p>
    <a href="https://pypi.org/project/mousebase/"><img src="https://img.shields.io/pypi/v/mousebase?style=flat-square&label=PyPI&color=f59e0b" alt="PyPI" /></a>
    <a href="https://www.npmjs.com/package/mousebase"><img src="https://img.shields.io/npm/v/mousebase?style=flat-square&label=npm&color=d97706" alt="npm" /></a>
    <a href="https://pypi.org/project/mousebase/"><img src="https://img.shields.io/pypi/pyversions/mousebase?style=flat-square&label=Python&color=b45309" alt="Python" /></a>
    <a href="https://api.mousebase.dev/health/"><img src="https://img.shields.io/endpoint?style=flat-square&url=https%3A%2F%2Fapi.mousebase.dev%2Fhealth%2F&label=API&color=f59e0b" alt="API Status" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Proprietary-fde68a?style=flat-square" alt="License" /></a>
    <a href="https://github.com/Lumine8/MouseBase-AI/actions"><img src="https://img.shields.io/github/actions/workflow/status/Lumine8/MouseBase-AI/ci.yml?style=flat-square&label=CI&color=f59e0b" alt="CI" /></a>
  </p>
</div>

---

## What is MouseBase?

MouseBase gives your AI agents **persistent memory**. Store, retrieve, and semantically search memories with a simple API — backed by vector embeddings and PostgreSQL.

Unlike traditional databases that match exact keywords, MouseBase finds memories by **meaning**. Your AI can remember user preferences, conversation context, and past decisions without you writing complex query logic.

## Live

| Service | URL |
|---------|-----|
| Dashboard | [mouse-base-ai.vercel.app](https://mouse-base-ai.vercel.app) |
| API | [api.mousebase.dev](https://api.mousebase.dev) |
| Health | [api.mousebase.dev/health/](https://api.mousebase.dev/health/) |

---

## Quick Start

### 1. Install the SDK

```bash
pip install mousebase
```

### 2. Use it

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_...")

# Store a memory
result = client.remember("The user prefers dark mode.")
print(result.memory_id)

# Search semantically
results = client.search("What theme does the user want?")
for r in results.results:
    print(f"{r.content} (score: {r.score})")
```

## TypeScript / JavaScript SDK

```bash
npm install mousebase
```

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase({ apiKey: process.env.MOUSEBASE_API_KEY! });

// Store a memory
await client.remember({ content: "Alice prefers dark mode" });

// Search semantically
const results = await client.search({ query: "UI preferences" });
console.log(results.results);
```

### Browser SDK

```typescript
import { MouseBaseBrowser } from "mousebase/browser";
const client = new MouseBaseBrowser({ token: "jwt_token_here" });
await client.remember({ content: "Logged in user preference" });
```

### AI Framework Integrations

```typescript
import { MouseBaseMemory } from "mousebase/integrations/langchain";
import { MouseBaseMemoryStore } from "mousebase/integrations/llama-index";
import { MouseBaseAgentMemory } from "mousebase/integrations/openai-agents";
import { createMousebaseMcpServer } from "mousebase/integrations/mcp-server";
```

### Framework Adapters

```typescript
import { NextMouseBase } from "mousebase/adapters/nextjs";
import { ExpressMouseBase } from "mousebase/adapters/express";
import { NestMouseBase } from "mousebase/adapters/nestjs";
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";
```

### CLI

```bash
npx mousebase login
npx mousebase remember "Alice likes dark mode"
npx mousebase search "UI preferences"
npx mousebase projects list
```

---

## Pricing

| Plan | Price | Memories | Projects | Searches/mo | Requests/hr |
|------|-------|----------|----------|-------------|-------------|
| Free | $0 | 1,000 | 1 | 100 | 10 |
| Hobby | $3.99/mo | 25,000 | 5 | 5,000 | 200 |
| Pro | $7.99/mo | 250,000 | 10 | 50,000 | 2,000 |

Addons available: extra memories (+$1/mo per 10k), extra projects (+$1/mo each), extra searches (+$1/mo per 1k).

---

## API Endpoints

All endpoints are available at `https://api.mousebase.dev/api/v1`.

### Memory Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/remember/` | Store a memory |
| `POST` | `/search/` | Search memories semantically |
| `GET` | `/memory/{id}` | Get a memory by ID |
| `PATCH` | `/memory/{id}` | Update a memory |
| `DELETE` | `/memory/{id}` | Delete a memory |

### Memory Explorer

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects/{id}/memories` | Paginated list with filters |
| `GET` | `/projects/{id}/memories/stats` | Per-project analytics |
| `POST` | `/projects/{id}/memories/batch-delete` | Delete multiple memories |
| `POST` | `/projects/{id}/memories/export` | Export as JSON/CSV/NDJSON |
| `POST` | `/projects/{id}/memories/move` | Move to another project |
| `POST` | `/projects/{id}/memories/batch-add-metadata` | Bulk metadata update |
| `GET` | `/projects/{id}/memories/timeline` | Activity timeline |

### Data Explorer

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/data/tables` | List all tables with row counts |
| `GET` | `/data/{table}/rows` | Paginated rows with sorting |
| `GET` | `/data/{table}/count` | Row count for a table |

### Account & Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account |
| `POST` | `/auth/login` | Sign in (returns access + refresh tokens) |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/verify-email` | Verify email with token |
| `POST` | `/auth/resend-verification` | Resend verification email |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/auth/sessions` | List active sessions |
| `DELETE` | `/auth/sessions/{id}` | Revoke a session |
| `DELETE` | `/auth/sessions` | Revoke all sessions |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects/` | List projects |
| `POST` | `/projects/` | Create project (returns API key) |
| `GET` | `/projects/{id}` | Get project |
| `PATCH` | `/projects/{id}` | Update project |
| `DELETE` | `/projects/{id}` | Delete project |
| `POST` | `/projects/{id}/api-key/rotate` | Rotate API key |

### Dashboard & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/metrics` | Dashboard metrics |
| `GET` | `/dashboard/analytics` | Usage analytics with daily breakdown |
| `GET` | `/dashboard/billing-usage` | Billing usage summary |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payments/plans` | List available plans |
| `POST` | `/payments/create-order` | Create Razorpay order |
| `POST` | `/payments/verify` | Verify payment |
| `GET` | `/payments/subscription` | Get subscription info |
| `POST` | `/payments/cancel` | Cancel subscription |
| `GET` | `/payments/history` | Billing history |
| `POST` | `/payments/create-addon-order` | Create addon order |
| `POST` | `/payments/verify-addon` | Verify addon payment |
| `POST` | `/payments/cancel-addon` | Cancel addon |

---

## Security & Infrastructure

MouseBase is built with production security from day one.

### Authentication
- **JWT access tokens**: 15-minute expiry, signed with HS256
- **JWT refresh tokens**: 30-day expiry, one-time rotation on use, stored hashed
- **API keys**: `mb_live_{key_id}_{secret}` format, hashed with argon2, encrypted at rest
- **Email verification**: Token-based verification with 24-hour expiry
- **Password reset**: Token-based with 1-hour expiry, invalidates all sessions on reset

### Session Management
- All login sessions tracked with user agent + IP address
- View active sessions: `GET /auth/sessions`
- Revoke specific sessions: `DELETE /auth/sessions/{id}`
- Sign out everywhere: `DELETE /auth/sessions`

### Rate Limiting
- 60 requests per minute per IP (configurable)
- Disabled in development
- Per-endpoint rate limit overrides available

### Security Headers
- `Strict-Transport-Security` (HSTS, 1 year, include subdomains)
- `X-Content-Type-Options` (nosniff)
- `X-Frame-Options` (DENY)
- `Referrer-Policy` (strict-origin-when-cross-origin)
- `Permissions-Policy` (no camera/mic/geolocation)

### Request Tracking
- Every request gets a unique `X-Request-ID`
- Response timing via `X-Response-Time-Ms`
- Structured JSON logging via structlog, with request ID propagation

### Error Monitoring
- Sentry integration (enable with `SENTRY_DSN` env var)
- All unhandled exceptions logged with request ID
- Structured error responses: `{"error": {"code": "...", "message": "..."}}`

---

## Self-Hosting

### Requirements

- Python 3.12+
- PostgreSQL 16+ with pgvector extension
- An embedding provider (Gemini or OpenAI API key)

### Backend Setup

```bash
git clone https://github.com/Lumine8/MouseBase-AI.git
cd MouseBase-AI/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, etc.

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker run -d \
  --name mousebase \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/mousebase \
  -e GEMINI_API_KEY=your_key \
  lumine8/mousebase:latest
```

---

## Python SDK

Full documentation at [mousebase/README.md](mousebase/README.md).

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_...")

# Remember
result = client.remember("content", external_id="opt", metadata={})

# Search
results = client.search("query", top_k=10)

# Get / Update / Delete
memory = client.get("id")
client.update("id", content="new content")
client.delete("id")

# Auth
auth = client.signup("email", "password")
auth = client.login("email", "password")
user = client.me()

# Projects
project = client.projects.create(name="My Project")
```

---

## Examples

See the [examples directory](mousebase/examples/) for complete runnable scripts:

- `notes.py` — Simple notes app with semantic search
- `rag.py` — RAG pipeline (index -> retrieve -> LLM prompt)
- `discord.py` — Discord bot with per-user memory recall
- `notion.py` — Full CRUD notes app with MouseBase search
- `customer_support.py` — Support ticket system with similar-issue lookup
- `agent_memory.py` — AI agent with session-based memory management

---

## Architecture

```
┌─────────────────┐     ┌──────────┐     ┌─────────────────┐
│  Python SDK      │     │          │     │                 │
│  TypeScript SDK  │────▶│  FastAPI  │────▶│  PostgreSQL +   │
│  Browser SDK     │     │  Server  │     │    pgvector     │
│  CLI / HTTP      │     │          │     │                 │
└─────────────────┘     └──────────┘     └─────────────────┘
```

### Deployed Infrastructure

```
Frontend (Vercel)  ──▶  API (Render)  ──▶  PostgreSQL (Neon)
  mouse-base-ai.         api.mousebase.dev     ep-quiet-tooth-...
  vercel.app                                      (connection pooled)
       │                       │
       │                       ├── Sentry (error tracking)
       │                       └── Keepalive pings (GitHub Actions, 10 min)
       │
       └── PyPI / npm (package distribution)
```

---

## Development

### CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| Backend CI | Push to main/develop, PRs | Ruff lint, Black format, pytest, Docker build |
| Deploy Frontend | Push to main (frontend/) | Build + deploy to Vercel |
| Keepalive | Every 10 minutes | Pings Render + Neon to prevent free-tier sleep |

### Commands

```bash
# Backend linting
cd backend
ruff check .
black --check .

# Tests
pytest -vv

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Status

MouseBase is in active development. The API is stable and ready for production use.

- **Python SDK**: v0.2.9 ([PyPI](https://pypi.org/project/mousebase/))
- **JavaScript SDK**: v0.1.4 ([npm](https://www.npmjs.com/package/mousebase))
- **Backend API**: v0.1.0 ([api.mousebase.dev](https://api.mousebase.dev))
- **Dashboard**: [mouse-base-ai.vercel.app](https://mouse-base-ai.vercel.app)

## License

Proprietary. See [LICENSE](LICENSE).
