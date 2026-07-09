<div align="center">
  <img src="frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="120" />
  <br /><br />
  <p><strong>Persistent memory infrastructure for AI agents.</strong></p>
  <p>
    <a href="https://pypi.org/project/mousebase/"><img src="https://img.shields.io/pypi/v/mousebase?style=flat-square&label=PyPI&color=f59e0b" alt="PyPI" /></a>
    <a href="https://www.npmjs.com/package/mousebase"><img src="https://img.shields.io/npm/v/mousebase?style=flat-square&label=npm&color=d97706" alt="npm" /></a>
    <a href="https://pypi.org/project/mousebase/"><img src="https://img.shields.io/pypi/pyversions/mousebase?style=flat-square&label=Python&color=b45309" alt="Python" /></a>
    <a href="https://hub.docker.com/r/lumine8/mousebase"><img src="https://img.shields.io/docker/v/lumine8/mousebase?style=flat-square&label=Docker&color=fbbf24" alt="Docker" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Proprietary-fde68a?style=flat-square" alt="License" /></a>
    <a href="https://github.com/anomalyco/MouseBase/actions"><img src="https://img.shields.io/github/actions/workflow/status/anomalyco/MouseBase/ci.yml?style=flat-square&label=CI&color=f59e0b" alt="CI" /></a>
    <a href="https://github.com/anomalyco/MouseBase"><img src="https://img.shields.io/github/stars/anomalyco/MouseBase?style=flat-square&label=Stars&color=b45309" alt="Stars" /></a>
  </p>
</div>

---

## What is MouseBase?

MouseBase gives your AI agents **persistent memory**. Store, retrieve, and semantically search memories with a simple API — backed by vector embeddings and PostgreSQL.

Unlike traditional databases that match exact keywords, MouseBase finds memories by **meaning**. Your AI can remember user preferences, conversation context, and past decisions without you writing complex query logic.

## Why MouseBase?

- **Semantic search** — find relevant memories by meaning, not keywords
- **Fast** — sub-50ms queries with pgvector indexing
- **Simple** — one API key, one endpoint to start
- **Any stack** — Python SDK, REST API, or your HTTP client
- **Self-hostable** — Docker deploy in one command
- **PostgreSQL backed** — no exotic infrastructure needed

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

const client = new MouseBase({
  apiKey: process.env.MOUSEBASE_API_KEY!,
});

// Store a memory
await client.remember({
  content: "Alice prefers dark mode",
});

// Search semantically
const results = await client.search({
  query: "UI preferences",
});
console.log(results.results);
```

### Browser SDK

```typescript
import { MouseBaseBrowser } from "mousebase/browser";

// Uses JWT auth — never exposes API keys in the browser
const client = new MouseBaseBrowser({ token: "jwt_token_here" });
await client.remember({ content: "Logged in user preference" });
```

### CLI

```bash
npx mousebase login
npx mousebase remember "Alice likes dark mode"
npx mousebase search "UI preferences"
npx mousebase projects list
```

### Framework Adapters

```typescript
import { NextMouseBase } from "mousebase/adapters/nextjs";
import { ExpressMouseBase } from "mousebase/adapters/express";
import { NestMouseBase } from "mousebase/adapters/nestjs";
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";
```

### AI Framework Integrations

```typescript
import { MouseBaseMemory } from "mousebase/integrations/langchain";
import { MouseBaseMemoryStore } from "mousebase/integrations/llama-index";
import { MouseBaseAgentMemory } from "mousebase/integrations/openai-agents";
import { createMousebaseMcpServer } from "mousebase/integrations/mcp-server";
```

## Docker

```bash
docker run -d \
  --name mousebase \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/mousebase \
  -e GEMINI_API_KEY=your_key \
  lumine8/mousebase:latest
```

## Self-Hosting

### Requirements

- Python 3.10+
- PostgreSQL 16+ with pgvector extension
- An embedding provider (Gemini or OpenAI API key)

### Setup

```bash
git clone https://github.com/anomalyco/MouseBase.git
cd MouseBase
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run
uvicorn app.main:app --reload
```

## Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_...")

# Remember
result = client.remember("content", external_id="opt", metadata={})

# Search
results = client.search("query", top_k=10)

# Get
memory = client.get("id")

# Update
client.update("id", content="new content")

# Delete
client.delete("id")
```

## API

All endpoints are documented with OpenAPI at `/docs` when the server is running.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/remember/` | Store a memory |
| `POST` | `/api/v1/search/` | Search memories |
| `GET` | `/api/v1/memory/<id>` | Get a memory |
| `PATCH` | `/api/v1/memory/<id>` | Update a memory |
| `DELETE` | `/api/v1/memory/<id>` | Delete a memory |
| `GET` | `/api/v1/projects/` | List projects |
| `POST` | `/api/v1/projects/` | Create project |
| `GET` | `/api/v1/projects/<id>` | Get project |
| `PATCH` | `/api/v1/projects/<id>` | Update project |
| `DELETE` | `/api/v1/projects/<id>` | Delete project |
| `POST` | `/api/v1/projects/<id>/api-key/rotate` | Rotate API key |

## Examples

See the [examples directory](mousebase/examples/) for complete runnable scripts:

- `notes.py` — Simple notes app with semantic search
- `rag.py` — RAG pipeline (index → retrieve → LLM prompt)
- `discord.py` — Discord bot with per-user memory recall
- `notion.py` — Full CRUD notes app with MouseBase search
- `customer_support.py` — Support ticket system with similar-issue lookup
- `agent_memory.py` — AI agent with session-based memory management

## Documentation

Full documentation is available at the in-app `/docs` page, or in the [VitePress docs](docs/) directory:

- [Introduction](docs/guide/introduction.md)
- [Quickstart](docs/guide/quickstart.md)
- [Authentication](docs/guide/authentication.md)
- [Projects](docs/guide/projects.md)
- [Remember](docs/guide/remember.md)
- [Search](docs/guide/search.md)
- [Errors](docs/guide/errors.md)
- [Python SDK](docs/guide/python-sdk.md)
- [JavaScript SDK](docs/guide/js-sdk.md)
- [FAQ](docs/guide/faq.md)

## Architecture

```
┌─────────────────┐     ┌──────────┐     ┌─────────────────┐
│  Python SDK      │     │          │     │                 │
│  TypeScript SDK  │────▶│  FastAPI  │────▶│  PostgreSQL +   │
│  Browser SDK     │     │  Server  │     │    pgvector     │
│  CLI / HTTP      │     │          │     │                 │
└─────────────────┘     └──────────┘     └─────────────────┘
```

## Status

MouseBase is in active development. The API is stable and ready for production use.

## License

Proprietary. See [LICENSE](LICENSE).
