<div align="center">
  <img src="https://raw.githubusercontent.com/Lumine8/MouseBase-AI/main/frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="60" />
</div>

# Introduction

MouseBase is a managed memory service for AI applications. It lets you store text memories and search them semantically — so your agents can recall relevant context at runtime.

## Why MouseBase?

- **No infrastructure to manage** — embeddings, vector storage, and search are handled for you
- **Simple API** — one endpoint to remember, one to search
- **Works with any stack** — Python SDK, TypeScript SDK, REST API
- **Semantic search out of the box** — powered by Gemini or OpenAI embeddings
- **Production-ready security** — JWT auth with refresh tokens, API key auth, rate limiting, email verification

## How it works

1. You store a memory: `client.remember(content="User clicked settings")`
2. MouseBase generates an embedding and stores it
3. You search later: `client.search(query="user preferences")`
4. MouseBase returns relevant memories ranked by similarity

## Features

### Memory & Search
- `POST /remember` — store a new memory with auto-embedding
- `POST /search` — semantic search with relevance scoring
- `GET /memory/{id}` — retrieve a memory by ID
- `PATCH /memory/{id}` — update a memory
- `DELETE /memory/{id}` — delete a memory

### Memory Explorer (UI)
- **Memory list** — paginated table of all memories in a project
- **Search & filter** — filter by content, external ID, metadata, date range
- **Memory inspector** — click a memory to view full details, metadata, and JSON
- **Bulk operations** — select multiple memories to delete, export, or move
- **Export** — JSON, CSV, NDJSON
- **Column customization** — show/hide columns like Airtable
- **Per-project analytics** — total memories, storage, avg length, top external IDs

### Account & Authentication
- `POST /auth/signup` — create account (sends verification email)
- `POST /auth/login` — log in (returns access + refresh tokens)
- `POST /auth/refresh` — refresh expired access tokens
- `POST /auth/verify-email` — verify email address
- `POST /auth/forgot-password` — request password reset
- `POST /auth/reset-password` — reset password with token
- `GET /auth/sessions` — list active login sessions
- `DELETE /auth/sessions/{id}` — revoke a specific session
- `DELETE /auth/sessions` — revoke all sessions (sign out everywhere)

### Projects & API Keys
- Project management — create, list, update, delete
- Auto-generated `mb_live_` API keys, hashed with argon2
- Key rotation — generate new key, immediately invalidate old one

### Infrastructure
- Rate limiting: 60 requests/minute per IP (configurable)
- Request IDs: every request gets `X-Request-ID`
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Error monitoring: Sentry integration (optional)
- Health checks: `GET /health/` with database status
- Structured JSON logging via structlog

### SDKs
- **Python SDK** — sync + async clients, retry with backoff, dotenv support
- **TypeScript SDK** — Node.js + browser clients, framework adapters (Next.js, Express, NestJS, Cloudflare Workers, Bun, Deno), AI integrations (LangChain, LlamaIndex, OpenAI Agents, CrewAI, Mastra, MCP Server)
