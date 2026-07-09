<div align="center">
  <img src="frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="600" />
  <br /><br />
  <p><strong>Persistent memory infrastructure for AI agents.</strong></p>
  <p>
    <a href="https://pypi.org/project/mousebase/"><img src="https://img.shields.io/pypi/v/mousebase?style=flat-square&label=PyPI&color=f59e0b" alt="PyPI" /></a>
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
from mousebase import Client

client = Client(api_key="mb_live_...")

# Store a memory
result = client.remember("The user prefers dark mode.")
print(result.id)

# Search semantically
results = client.search("What theme does the user want?")
for r in results:
    print(f"{r.content} (score: {r.score})")
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
from mousebase import Client

client = Client(api_key="mb_live_...")

# Remember
result = client.remember("content", external_id="opt", metadata={})

# Search
results = client.search("query", top_k=10)

# Get
memory = client.get_memory("id")

# Update
client.update_memory("id", content="new content")

# Delete
client.delete_memory("id")
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

See the [examples directory](examples/) for complete examples:

- `basic.py` — Basic remember and search
- `chatbot.py` — Chatbot with persistent memory
- `rag.py` — RAG (Retrieval-Augmented Generation) pipeline
- `customer_support.py` — Support ticket memory
- `ai_agent.py` — AI agent with session memory

## Documentation

Full documentation is available at `/docs` on the server, or in the [docs](docs/) directory:

- [Getting Started](docs/installation.md)
- [Authentication](docs/auth.md)
- [Projects](docs/projects.md)
- [Remember](docs/remember.md)
- [Search](docs/search.md)
- [Update & Delete](docs/update-delete.md)
- [Python SDK](docs/python-sdk.md)
- [API Reference](docs/api.md)
- [Docker](docs/docker.md)
- [Deployment](docs/deployment.md)

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌─────────────────┐
│  Python SDK  │────▶│  FastAPI  │────▶│  PostgreSQL +   │
│  / HTTP API  │     │  Server  │     │    pgvector     │
└─────────────┘     └──────────┘     └─────────────────┘
```

## Status

MouseBase is in active development. The API is stable and ready for production use.

## License

Proprietary. See [LICENSE](LICENSE).
