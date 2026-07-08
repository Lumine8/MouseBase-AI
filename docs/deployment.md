# Deployment

## Production Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL 16+ with pgvector extension
- [ ] A Gemini or OpenAI API key for embeddings
- [ ] A secure `SECRET_KEY` (generate via `openssl rand -hex 32`)
- [ ] `ENVIRONMENT=production`

## Option 1: Docker Compose (single server)

```bash
git clone https://github.com/anomalyco/MouseBase.git
cd MouseBase/backend
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

## Option 2: Railway

1. Create a new project on Railway
2. Add a PostgreSQL database plugin
3. Connect your GitHub repository
4. Set the build command: `cd backend && pip install -e .`
5. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
6. Add environment variables from `.env.example`

## Option 3: Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set root directory: `backend`
4. Build command: `pip install -e .`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
6. Add a PostgreSQL database (Render's managed Postgres supports pgvector)

## Option 4: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mousebase-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mousebase
  template:
    metadata:
      labels:
        app: mousebase
    spec:
      containers:
      - name: api
        image: lumine8/mousebase
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mousebase-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: mousebase-secrets
              key: secret-key
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: mousebase-secrets
              key: gemini-api-key
        - name: ENVIRONMENT
          value: "production"
```

## Health Check

```bash
curl http://your-host:8000/
# {"status": "ok", "service": "MouseBase Memory API"}
```
