# Docker

## Pull from Docker Hub

```bash
docker pull lumine8/mousebase
```

## Run

```bash
docker run -d \
  --name mousebase \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql+psycopg://user:pass@host:5432/mousebase \
  -e SECRET_KEY=your-secret-key \
  -e GEMINI_API_KEY=your-gemini-key \
  -e ENVIRONMENT=production \
  lumine8/mousebase
```

## Docker Compose

```yaml
version: "3.8"
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: mousebase
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: lumine8/mousebase
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - .env
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Secret for API key hashing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | Alternative embedding provider |
| `ENVIRONMENT` | `development` or `production` |
