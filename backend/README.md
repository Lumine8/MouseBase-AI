# MouseBase Backend

FastAPI server powering the MouseBase memory API.

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 16+ with pgvector extension
- An embedding provider API key (Gemini or OpenAI)

### Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"

# Copy and configure environment
copy .env.example .env
# Edit .env with your database URL and API keys

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

### Docker

```bash
docker compose up --build
```

The API will be available at `http://localhost:8000`.

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `SECRET_KEY` | — | JWT signing secret |
| `GEMINI_API_KEY` | — | Google Gemini embedding key |
| `OPENAI_API_KEY` | — | OpenAI embedding key |
| `REDIS_URL` | `redis://localhost:6379/0` | Rate limiting store |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |

## API

The server exposes a REST API at `/api/v1/`. See the OpenAPI docs at `/docs` when running.
