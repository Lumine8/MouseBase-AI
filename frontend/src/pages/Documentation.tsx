import { useParams, useNavigate, useLocation } from "react-router-dom";
import PublicNav from "../components/PublicNav";

const groups = [
  {
    label: "Getting Started",
    items: [
      { id: "getting-started", label: "Overview" },
      { id: "installation", label: "Server Installation" },
      { id: "docker", label: "Docker" },
      { id: "deployment", label: "Deployment" },
      { id: "faq", label: "FAQ" },
    ],
  },
  {
    label: "API Usage",
    items: [
      { id: "authentication", label: "Authentication" },
      { id: "projects", label: "Projects" },
      { id: "remember", label: "Remember" },
      { id: "search", label: "Search" },
      { id: "get", label: "Get" },
      { id: "update-delete", label: "Update & Delete" },
      { id: "errors", label: "Errors" },
    ],
  },
  {
    label: "Python SDK",
    items: [
      { id: "sdk-installation", label: "Installation" },
      { id: "sdk-quickstart", label: "Quick Start" },
      { id: "sdk-sync", label: "Sync Client" },
      { id: "sdk-async", label: "Async Client" },
      { id: "sdk-projects", label: "Project Management" },
      { id: "sdk-auth", label: "Account Management" },
      { id: "sdk-errors", label: "Error Handling" },
      { id: "sdk-models", label: "Response Models" },
      { id: "sdk-examples", label: "Examples" },
    ],
  },
];

const content: Record<string, { title: string; body: string }> = {
  "getting-started": {
    title: "Overview",
    body: `MouseBase gives your AI agents persistent memory. Store, retrieve, and semantically search memories with a simple API.

**What you'll need:**
- Python 3.10+ (for the SDK)
- A running MouseBase server (or access to a hosted instance)
- An API key

**Architecture:**
\`\`\`
┌─────────────┐     ┌──────────┐     ┌─────────────────┐
│  Python SDK  │────▶│  FastAPI  │────▶│  PostgreSQL +   │
│  / HTTP API  │     │  Server  │     │    pgvector     │
└─────────────┘     └──────────┘     └─────────────────┘
\`\`\`

**Flow:**
1. Your application sends a memory to the API
2. The server generates an embedding using an LLM provider
3. The embedding and content are stored in PostgreSQL with pgvector
4. When you search, the server finds semantically similar memories`
  },
  "installation": {
    title: "Server Installation",
    body: `## Backend (Server)

Clone the repository:

\`\`\`bash
git clone https://github.com/anomalyco/MouseBase.git
cd MouseBase
\`\`\`

Set up the environment:

\`\`\`bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\\Scripts\\activate     # Windows
pip install -r requirements.txt
\`\`\`

Configure environment variables:

\`\`\`bash
cp .env.example .env
# Edit .env with your database URL and API keys
\`\`\`

Run the server:

\`\`\`bash
uvicorn app.main:app --reload
\`\`\`

## Docker

\`\`\`bash
docker run -d \\
  --name mousebase \\
  -p 8000:8000 \\
  -e DATABASE_URL=postgresql://... \\
  lumine8/mousebase:latest
\`\`\``
  },
  "docker": {
    title: "Docker",
    body: `Run MouseBase with Docker for easy deployment.

## Quick Start

\`\`\`bash
docker run -d \\
  --name mousebase \\
  -p 8000:8000 \\
  -e DATABASE_URL=postgresql://user:pass@host:5432/mousebase \\
  -e GEMINI_API_KEY=your_gemini_key \\
  lumine8/mousebase:latest
\`\`\`

## Docker Compose

\`\`\`yaml
version: "3.8"
services:
  app:
    image: lumine8/mousebase:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://mousebase:password@db:5432/mousebase
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: mousebase
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mousebase
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
\`\`\`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| \`DATABASE_URL\` | Yes | — | PostgreSQL connection string |
| \`GEMINI_API_KEY\` | One required | — | Google Gemini API key |
| \`OPENAI_API_KEY\` | One required | — | OpenAI API key |
| \`HOST\` | No | \`0.0.0.0\` | Server bind address |
| \`PORT\` | No | \`8000\` | Server port |`
  },
  "deployment": {
    title: "Deployment",
    body: `Deploy MouseBase to production.

## Requirements

- PostgreSQL 16+ with pgvector extension
- Python 3.10+
- An embedding provider (Gemini or OpenAI)

## Production Checklist

1. **Database** — Use a managed PostgreSQL provider (Neon, Supabase, AWS RDS)
2. **Authentication** — Set strong API keys via the project dashboard
3. **SSL** — Use a reverse proxy (Caddy, Nginx) with TLS
4. **Environment** — Use environment variables for all secrets
5. **Monitoring** — Set up health checks and logging

## Deploy with Docker

\`\`\`bash
docker run -d \\
  --name mousebase \\
  --restart unless-stopped \\
  -p 8000:8000 \\
  -e DATABASE_URL=postgresql://... \\
  -e GEMINI_API_KEY=... \\
  lumine8/mousebase:latest
\`\`\`

## Deploy with Docker Compose

Use the \`docker-compose.yml\` from the Docker section.

## Health Check

\`\`\`bash
curl http://localhost:8000/health
# {"status": "ok"}
\`\`\``
  },
  "faq": {
    title: "FAQ",
    body: `## What is MouseBase?

MouseBase is persistent memory infrastructure for AI agents. It lets you store, retrieve, and semantically search memories using vector embeddings.

## How is it different from a database?

Unlike a traditional database that matches exact keywords, MouseBase uses semantic search powered by vector embeddings. It finds memories by meaning, not exact matches.

## What embedding provider do you use?

MouseBase supports both Google Gemini and OpenAI embeddings. Configure either via environment variables.

## Can I self-host?

Yes. MouseBase is designed for self-hosting. The Docker image includes everything you need.

## What database do you use?

PostgreSQL with the pgvector extension. This gives you the reliability of PostgreSQL with vector search capabilities.

## Is there a hosted version?

Cloud hosting is coming soon. For now, self-host using Docker.

## How do I get an API key?

Create a project through the dashboard or API. Each project gets its own API key.

## Do you have a Python SDK?

Yes. Install with \`pip install mousebase\`.

## What about other languages?

The API is a standard REST API. You can use any HTTP client — cURL, JavaScript fetch, Go's http package, etc.

## Where can I get help?

Open an issue on GitHub or check the documentation.`
  },
  "authentication": {
    title: "Authentication",
    body: `All API requests require authentication via an API key.

## API Key Format

\`\`\`
mb_live_<key_id>_<secret>
\`\`\`

## Python

\`\`\`python
from mousebase import MouseBase

# Pass API key directly
client = MouseBase(api_key="mb_live_abc123_def456")

# Or use the MOUSEBASE_API_KEY environment variable
client = MouseBase()
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_abc123_def456";
const BASE_URL = "http://localhost:8000";

const response = await fetch(\`\${BASE_URL}/api/v1/remember/\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ content: "Hello, world!" })
});
\`\`\`

## cURL

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/remember/ \\
  -H "Authorization: Bearer mb_live_abc123_def456" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello, world!"}'
\`\`\`

## Environment Variable

Set \`MOUSEBASE_API_KEY\` in your environment and the SDK will pick it up automatically.`
  },
  "projects": {
    title: "Projects",
    body: `Projects organize your memories and API keys.

## Endpoint

\`POST /api/v1/projects\`

## Python

\`\`\`python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

# Create a project
project = client.projects.create(
    name="My Project",
    description="My first project"
)
print(project.api_key)

# List all projects
projects = client.projects.list()
for p in projects:
    print(f"{p.name} ({p.id})")

# Get a project by ID
project = client.projects.get("proj_abc123")

# Update a project
client.projects.update("proj_abc123", name="New Name")

# Delete a project
client.projects.delete("proj_abc123")

# Rotate API key
project = client.projects.rotate_key("proj_abc123")
print(project.api_key)
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";
const BASE = "http://localhost:8000/api/v1";
const headers = {
  "Authorization": \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json"
};

// Create
const created = await fetch(\`\${BASE}/projects/\`, {
  method: "POST", headers,
  body: JSON.stringify({ name: "My Project", description: "My first project" })
});

// List
const listed = await fetch(\`\${BASE}/projects/\`, { headers });

// Get
const gotten = await fetch(\`\${BASE}/projects/proj_abc123\`, { headers });

// Update
await fetch(\`\${BASE}/projects/proj_abc123\`, {
  method: "PATCH", headers,
  body: JSON.stringify({ name: "New Name" })
});

// Delete
await fetch(\`\${BASE}/projects/proj_abc123\`, { method: "DELETE", headers });

// Rotate API key
await fetch(\`\${BASE}/projects/proj_abc123/api-key/rotate\`, { method: "POST", headers });
\`\`\`

## cURL

\`\`\`bash
# Create
curl -X POST http://localhost:8000/api/v1/projects/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Project", "description": "My first project"}'

# List
curl http://localhost:8000/api/v1/projects/ \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get
curl http://localhost:8000/api/v1/projects/proj_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Update
curl -X PATCH http://localhost:8000/api/v1/projects/proj_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "New Name"}'

# Delete
curl -X DELETE http://localhost:8000/api/v1/projects/proj_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Rotate API Key
curl -X POST http://localhost:8000/api/v1/projects/proj_abc123/api-key/rotate \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\``
  },
  "remember": {
    title: "Remember",
    body: `Store a new memory.

## Endpoint

\`POST /api/v1/remember/\`

## Request Body

\`\`\`json
{
  "content": "The user's favorite framework is React.",
  "external_id": "user_123",
  "metadata": {
    "source": "chat",
    "importance": "high"
  }
}
\`\`\`

## Response

\`\`\`json
{
  "id": "mem_abc123",
  "created_at": "2025-01-15T10:30:00Z"
}
\`\`\`

## Python

\`\`\`python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

result = client.remember(
    content="The user's favorite framework is React.",
    external_id="user_123",
    metadata={"source": "chat", "importance": "high"}
)
print(f"Stored: {result.memory_id}")
# Stored: mem_abc123
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";

const response = await fetch("http://localhost:8000/api/v1/remember/", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    content: "The user's favorite framework is React.",
    external_id: "user_123",
    metadata: { source: "chat", importance: "high" }
  })
});
const data = await response.json();
console.log(data);
// { id: "mem_abc123", created_at: "2025-01-15T10:30:00Z" }
\`\`\`

## cURL

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/remember/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "The user prefers dark mode."}'
\`\`\``
  },
  "search": {
    title: "Search",
    body: `Search for semantically similar memories.

## Endpoint

\`POST /api/v1/search/\`

## Request Body

\`\`\`json
{
  "query": "What framework does the user prefer?",
  "top_k": 10
}
\`\`\`

## Response

\`\`\`json
{
  "results": [
    {
      "id": "mem_abc123",
      "content": "The user's favorite framework is React.",
      "score": 0.92,
      "metadata": {"source": "chat"},
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

## Python

\`\`\`python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

results = client.search("What framework does the user prefer?", top_k=10)
for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")
#   [0.92] The user's favorite framework is React.
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";

const response = await fetch("http://localhost:8000/api/v1/search/", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query: "What framework does the user prefer?", top_k: 10 })
});
const data = await response.json();
data.results.forEach(r => console.log(\`[\${r.score.toFixed(2)}] \${r.content}\`));
// [0.92] The user's favorite framework is React.
\`\`\`

## cURL

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/search/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What framework?", "top_k": 5}'
\`\`\``
  },
  "get": {
    title: "Get a Memory",
    body: `Retrieve a specific memory by ID.

## Endpoint

\`GET /api/v1/memory/<id>\`

## Response

\`\`\`json
{
  "id": "mem_abc123",
  "content": "The user prefers dark mode.",
  "external_id": "user_456",
  "metadata": {"source": "settings"},
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
\`\`\`

## Python

\`\`\`python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

memory = client.get("mem_abc123")
print(memory.content)       # The user prefers dark mode.
print(memory.external_id)   # user_456
print(memory.metadata)      # {"source": "settings"}
print(memory.created_at)    # 2025-01-15 10:30:00+00:00
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";

const response = await fetch("http://localhost:8000/api/v1/memory/mem_abc123", {
  headers: { "Authorization": \`Bearer \${API_KEY}\` }
});
const memory = await response.json();
console.log(memory.content);     // The user prefers dark mode.
console.log(memory.external_id); // user_456
\`\`\`

## cURL

\`\`\`bash
curl http://localhost:8000/api/v1/memory/mem_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\``
  },
  "update-delete": {
    title: "Update & Delete",
    body: `Update or delete a specific memory by ID.

## Update

\`PATCH /api/v1/memory/<id>\`

### Request Body

\`\`\`json
{
  "content": "Updated content",
  "metadata": {"edited": true}
}
\`\`\`

### Response

Returns the updated memory object.

## Delete

\`DELETE /api/v1/memory/<id>\`

### Response

Returns \`204 No Content\` on success.

## Python

\`\`\`python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

# Update a memory
client.update(
    memory_id="mem_abc123",
    content="Updated content",
    metadata={"edited": True}
)

# Delete a memory
client.delete("mem_abc123")  # Returns None on success
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";
const BASE = "http://localhost:8000/api/v1";
const headers = {
  "Authorization": \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json"
};

// Update
await fetch(\`\${BASE}/memory/mem_abc123\`, {
  method: "PATCH", headers,
  body: JSON.stringify({ content: "Updated content", metadata: { edited: true } })
});

// Delete
await fetch(\`\${BASE}/memory/mem_abc123\`, { method: "DELETE", headers });
// Returns 204 No Content
\`\`\`

## cURL

\`\`\`bash
# Update
curl -X PATCH http://localhost:8000/api/v1/memory/mem_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Updated content", "metadata": {"edited": true}}'

# Delete
curl -X DELETE http://localhost:8000/api/v1/memory/mem_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\``
  },
  "errors": {
    title: "Errors",
    body: `All errors return a consistent JSON format.

## Error Format

\`\`\`json
{
  "error": {
    "code": "invalid_api_key",
    "message": "The provided API key is invalid."
  }
}
\`\`\`

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| \`invalid_api_key\` | 401 | API key is missing or invalid |
| \`not_found\` | 404 | Resource (memory/project) not found |
| \`validation_error\` | 422 | Request body validation failed |
| \`forbidden\` | 403 | Insufficient permissions |
| \`rate_limited\` | 429 | Too many requests |
| \`internal_error\` | 500 | Unexpected server error |

## Python

\`\`\`python
from mousebase import (
    MouseBase, MouseBaseError,
    AuthenticationError, ValidationError, RateLimitError
)

client = MouseBase(api_key="mb_live_xxx")

try:
    result = client.remember("Test memory")
except AuthenticationError:
    print("Invalid or expired API key")
except ValidationError as e:
    print(f"Validation failed: {e}")
except RateLimitError:
    print("Too many requests — slow down")
except MouseBaseError as e:
    print(f"Error {e.code}: {e.message} (HTTP {e.status_code})")
\`\`\`

## JavaScript

\`\`\`javascript
const API_KEY = "mb_live_xxx";

async function rememberMemory(content) {
  const response = await fetch("http://localhost:8000/api/v1/remember/", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const error = await response.json();
    switch (response.status) {
      case 401:
        throw new Error("Invalid or expired API key");
      case 422:
        throw new Error(\`Validation failed: \${error.error.message}\`);
      case 429:
        throw new Error("Too many requests — slow down");
      default:
        throw new Error(\`Error \${error.error.code}: \${error.error.message}\`);
    }
  }

  return response.json();
}

try {
  const data = await rememberMemory("Test memory");
  console.log(data);
} catch (err) {
  console.error(err.message);
}
\`\`\`

## cURL

\`\`\`bash
# Example: missing API key returns 401
curl -X POST http://localhost:8000/api/v1/remember/ \\
  -H "Content-Type: application/json" \\
  -d '{"content": "test"}'
# {"error": {"code": "invalid_api_key", "message": "The provided API key is invalid."}}

# Example: invalid body returns 422
curl -X POST http://localhost:8000/api/v1/remember/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"bad_field": true}'
# {"error": {"code": "validation_error", "message": "field required: content"}}
\`\`\``
  },
  "sdk-installation": {
    title: "Installation",
    body: `Install the Python SDK via pip:

\`\`\`bash
pip install mousebase
\`\`\`

Requires Python 3.10+.

## Dependencies

The SDK installs these packages automatically:

- \`httpx\` — HTTP client
- \`pydantic\` — Data validation and response models
- \`tenacity\` — Retry logic with exponential backoff

**Optional:** Install \`python-dotenv\` for \`.env\` file support:

\`\`\`bash
pip install python-dotenv
\`\`\`

## Verify Installation

\`\`\`python
from mousebase import MouseBase
print(MouseBase)
# <class 'mousebase.client.MouseBase'>
\`\`\``
  },
  "sdk-quickstart": {
    title: "Quick Start",
    body: `Get up and running in 60 seconds.

\`\`\`python
from mousebase import MouseBase

# Create a client (uses MOUSEBASE_API_KEY env var or pass directly)
client = MouseBase(api_key="mb_live_xxx")

# Store a memory
result = client.remember(
    content="User prefers dark mode in their IDE.",
    metadata={"source": "preferences"}
)
print(f"Stored: {result.memory_id}")

# Search semantically
results = client.search("What theme does the user like?", top_k=5)
for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")

# Retrieve, update, and delete
memory = client.get("mem_abc123")
client.update("mem_abc123", content="Updated content")
client.delete("mem_abc123")

# Clean up
client.close()
\`\`\`

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| \`MOUSEBASE_API_KEY\` | — | Your API key (required) |
| \`MOUSEBASE_BASE_URL\` | \`https://api.mousebase.ai/v1\` | Custom server URL |

The SDK also auto-loads from a \`.env\` file if \`python-dotenv\` is installed.`
  },
  "sdk-sync": {
    title: "Sync Client",
    body: `The \`MouseBase\` class is the synchronous client. It uses \`httpx.Client\` under the hood for blocking HTTP requests.

## Creating a Client

\`\`\`python
from mousebase import MouseBase

# Pass API key directly
client = MouseBase(api_key="mb_live_xxx")

# Use MOUSEBASE_API_KEY environment variable
client = MouseBase()

# Custom server URL and timeout
client = MouseBase(
    api_key="mb_live_xxx",
    base_url="https://api.mousebase.ai/v1",
    timeout=60
)
\`\`\`

## Memory Operations

### remember

\`\`\`python
result = client.remember(
    content="The user completed onboarding.",
    external_id="user_789",
    metadata={"source": "onboarding", "step": 5}
)
# result.memory_id -> "mem_abc123"
# result.created_at -> datetime
\`\`\`

### search

\`\`\`python
results = client.search("What do I know about the user?", top_k=10)
for r in results.results:
    print(f"[{r.score:.2f}] {r.content}")
\`\`\`

### get

\`\`\`python
memory = client.get("mem_abc123")
print(memory.content)
print(memory.metadata)
print(memory.external_id)
print(memory.created_at)
\`\`\`

### update

\`\`\`python
memory = client.update(
    memory_id="mem_abc123",
    content="Updated text",
    metadata={"edited": True},
    external_id="new_id"
)
\`\`\`

### delete

\`\`\`python
client.delete("mem_abc123")  # Returns None on success
\`\`\`

## Context Manager

\`\`\`python
with MouseBase(api_key="mb_live_xxx") as client:
    result = client.remember("Hello")
# Client is automatically closed on exit
\`\`\``
  },
  "sdk-async": {
    title: "Async Client",
    body: `For async environments (FastAPI, asyncio, AIOHTTP), use \`AsyncMouseBase\`. All methods are identical to the sync client but require \`await\`.

## Basic Usage

\`\`\`python
import asyncio
from mousebase import AsyncMouseBase

async def main():
    client = AsyncMouseBase(api_key="mb_live_xxx")

    result = await client.remember("Async memory")
    print(f"Stored: {result.memory_id}")

    results = await client.search("test", top_k=5)
    for r in results.results:
        print(f"  [{r.score:.2f}] {r.content}")

    memory = await client.get("mem_abc123")
    await client.update("mem_abc123", content="Updated")
    await client.delete("mem_abc123")

    await client.close()

asyncio.run(main())
\`\`\`

## Async Context Manager

\`\`\`python
async with AsyncMouseBase(api_key="mb_live_xxx") as client:
    result = await client.remember("Inside context manager")
    project = await client.projects.create(name="My Project")
\`\`\`

## Full Method Reference

All methods match the sync client:

| Method | Description |
|--------|-------------|
| \`await client.remember(...)\` | Store a memory |
| \`await client.search(...)\` | Semantic search |
| \`await client.get(id)\` | Get a memory |
| \`await client.update(id, ...)\` | Update a memory |
| \`await client.delete(id)\` | Delete a memory |
| \`await client.signup(...)\` | Create account |
| \`await client.login(...)\` | Log in |
| \`await client.me()\` | Get current user |
| \`await client.projects.create(...)\` | Create project |
| \`await client.projects.list()\` | List projects |
| \`await client.projects.get(id)\` | Get project |
| \`await client.projects.update(id, ...)\` | Update project |
| \`await client.projects.delete(id)\` | Delete project |
| \`await client.projects.view_key(id)\` | View API key |
| \`await client.projects.rotate_key(id)\` | Rotate API key |`
  },
  "sdk-projects": {
    title: "Project Management",
    body: `Projects isolate memories under separate API keys. Access project management via \`client.projects\`.

## Create a Project

\`\`\`python
project = client.projects.create(
    name="My Chatbot",
    description="Memories for my customer support chatbot"
)
print(project.api_key)  # "mb_live_..." — the project's API key
\`\`\`

## List Projects

\`\`\`python
projects = client.projects.list()
for p in projects:
    print(f"{p.name} ({p.id}) — {p.status}")
\`\`\`

## Get a Project

\`\`\`python
project = client.projects.get("proj_abc123")
print(project.name)
print(project.description)
print(project.status)
\`\`\`

## Update a Project

\`\`\`python
client.projects.update("proj_abc123", name="New Name", description="Updated description")
\`\`\`

## Delete a Project

\`\`\`python
client.projects.delete("proj_abc123")  # Irreversible
\`\`\`

## View API Key

\`\`\`python
key = client.projects.view_key("proj_abc123")
print(key.api_key)  # "mb_live_...xxxx" (partially masked)
\`\`\`

## Rotate API Key

Generates a new key. The old key is immediately invalidated.

\`\`\`python
project = client.projects.rotate_key("proj_abc123")
print(project.api_key)  # New key
\`\`\``
  },
  "sdk-auth": {
    title: "Account Management",
    body: `The SDK supports user authentication — sign up, log in, and retrieve user info.

## Sign Up

Creates a new user account and returns a JWT token plus user details.

\`\`\`python
auth = client.signup(
    email="user@example.com",
    password="securepassword123",
    full_name="Jane Doe"
)
print(auth.token)        # JWT token for API authentication
print(auth.user.email)   # "user@example.com"
print(auth.user.full_name)  # "Jane Doe"
\`\`\`

## Log In

\`\`\`python
auth = client.login(email="user@example.com", password="securepassword123")
print(auth.token)  # New JWT token
\`\`\`

## Get Current User

\`\`\`python
user = client.me()
print(user.email)          # "user@example.com"
print(user.full_name)      # "Jane Doe" or None
print(user.email_verified) # True/False
print(user.created_at)     # datetime
\`\`\`

## Auth Response Model

\`\`\`python
auth.token  # str — JWT token
auth.user   # UserResponse — user details

# UserResponse fields:
# .id             str
# .email          str
# .full_name      str | None
# .avatar_url     str | None
# .email_verified bool
# .created_at     datetime
# .updated_at     datetime
\`\`\``
  },
  "sdk-errors": {
    title: "Error Handling",
    body: `The SDK raises typed exceptions for every error condition. All exceptions inherit from \`MouseBaseError\`.

## Exception Hierarchy

| Exception | HTTP | Trigger |
|-----------|------|---------|
| \`MissingAPIKeyError\` | — | No API key provided or found in env |
| \`ValidationError\` | 400/422 | Invalid request payload |
| \`AuthenticationError\` | 401 | Invalid or expired API key |
| \`RateLimitError\` | 429 | Too many requests |
| \`InternalError\` | 500/502 | Server-side failure |
| \`EmbeddingProviderError\` | 503 | Embedding service unavailable |
| \`MouseBaseError\` | any | Base exception (catch-all) |

## Handling Errors

\`\`\`python
from mousebase import (
    MouseBase, MouseBaseError,
    MissingAPIKeyError, AuthenticationError,
    ValidationError, RateLimitError
)

client = MouseBase(api_key="mb_live_xxx")

try:
    result = client.remember("Test memory")
except MissingAPIKeyError:
    print("Set MOUSEBASE_API_KEY")
except AuthenticationError:
    print("Invalid or expired API key")
except ValidationError as e:
    print(f"Validation failed: {e}")
except RateLimitError:
    print("Slow down — rate limited")
except MouseBaseError as e:
    print(f"Error {e.code}: {e.message} (HTTP {e.status_code})")
\`\`\`

## Automatic Retries

The SDK retries transient failures automatically with exponential backoff:

| Scenario | Retries | Backoff |
|----------|---------|---------|
| Network errors | up to 3 | 1s → 2s → 4s (max 10s) |
| Timeouts | up to 3 | Same |
| HTTP 429 (rate limit) | up to 3 | Same |
| HTTP 500, 502, 503 | up to 3 | Same |

4xx errors (except 429) and 401 are **not** retried.

## Exception Attributes

\`\`\`python
try:
    client.remember("test")
except MouseBaseError as e:
    e.code         # str — error code like "invalid_api_key"
    e.message      # str — human-readable message
    e.status_code  # int — HTTP status code (0 if not applicable)
\`\`\``
  },
  "sdk-models": {
    title: "Response Models",
    body: `All responses are Pydantic models with full type hints. You get IDE autocompletion and runtime validation.

## Memory Models

\`\`\`
RememberResponse:
  memory_id:  str
  created_at: datetime

MemoryResponse:
  id:          str
  content:     str
  metadata:    dict
  external_id: str | None
  created_at:  datetime
  updated_at:  datetime
\`\`\`

## Search Models

\`\`\`
SearchResponse:
  results: list[SearchResult]

SearchResult:
  id:          str
  content:     str
  score:       float
  metadata:    dict
  external_id: str | None
\`\`\`

## Project Models

\`\`\`
ProjectKeyResponse:
  id:          str
  name:        str
  description: str | None
  api_key:     str | None
  plan:        str
  status:      str
  created_at:  datetime
  updated_at:  datetime

ProjectResponse:
  same as ProjectKeyResponse but without api_key

ApiKeyResponse:
  project_id: str
  api_key:    str
\`\`\`

## Auth Models

\`\`\`
AuthResponse:
  token: str
  user:  UserResponse

UserResponse:
  id:             str
  email:          str
  full_name:      str | None
  avatar_url:     str | None
  email_verified: bool
  created_at:     datetime
  updated_at:     datetime
\`\`\``
  },
  "sdk-examples": {
    title: "Examples",
    body: `Complete examples for real-world use cases.

## Chatbot with Memory

\`\`\`python
from mousebase import MouseBase
from datetime import datetime

client = MouseBase()

def chat(user_id: str, message: str) -> list[str]:
    # Store the interaction
    client.remember(
        content=message,
        external_id=user_id,
        metadata={"role": "user", "timestamp": str(datetime.now())}
    )

    # Retrieve relevant context from past conversations
    results = client.search(f"{user_id} {message}", top_k=5)
    return [r.content for r in results.results]
\`\`\`

## AI Agent Memory

\`\`\`python
from mousebase import MouseBase

client = MouseBase()

class AgentMemory:
    def store_step(self, agent_id: str, step: str, result: str):
        client.remember(
            content=f"Step: {step}\\nResult: {result}",
            external_id=agent_id,
            metadata={"type": "agent_step"}
        )

    def recall_context(self, agent_id: str, task: str) -> list[str]:
        results = client.search(f"{agent_id} {task}", top_k=20)
        return [r.content for r in results.results]

    def clear_session(self, agent_id: str):
        results = client.search(agent_id, top_k=100)
        for r in results.results:
            client.delete(r.id)
\`\`\`

## RAG Pipeline

\`\`\`python
from mousebase import MouseBase

client = MouseBase()

def retrieve_context(query: str, top_k: int = 5) -> list[str]:
    results = client.search(query, top_k=top_k)
    return [r.content for r in results.results]

# Use retrieved context with your LLM:
context = "\\n".join(retrieve_context("user preferences"))
prompt = f"Context:\\n{context}\\n\\nAnswer the question."
\`\`\`

## Customer Support KB

\`\`\`python
from mousebase import MouseBase

client = MouseBase()

def store_resolution(ticket_id: str, issue: str, resolution: str):
    client.remember(
        content=f"Issue: {issue}\\nResolution: {resolution}",
        external_id=ticket_id,
        metadata={"type": "support_ticket"}
    )

def search_similar_issues(description: str) -> list[tuple[str, float]]:
    results = client.search(description, top_k=3)
    return [(r.content, r.score) for r in results.results]
\`\`\`

## Using the Async Client in FastAPI

\`\`\`python
from fastapi import FastAPI
from mousebase import AsyncMouseBase

app = FastAPI()

@app.on_event("startup")
async def startup():
    app.state.mousebase = AsyncMouseBase()

@app.on_event("shutdown")
async def shutdown():
    await app.state.mousebase.close()

@app.post("/remember")
async def remember(content: str):
    result = await app.state.mousebase.remember(content)
    return {"memory_id": result.memory_id}
\`\`\``
  },
};

export default function Documentation() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app/");
  const flat = groups.flatMap((g) => g.items);
  const active = section && flat.some((s) => s.id === section) ? section : "getting-started";
  const page = content[active];

  return (
    <div>
      {!inApp && <PublicNav />}
      <div className="page doc-layout" style={{ paddingTop: inApp ? 0 : 80 }}>
      <aside className="doc-sidebar">
        <div className="section-title" style={{ marginBottom: 12 }}>Documentation</div>
        <nav className="doc-sidebar-nav">
          {groups.map((group) => (
            <div key={group.label} className="doc-group">
              <div className="doc-group-label">{group.label}</div>
              {group.items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/docs/${s.id}`)}
                  className={`doc-link${active === s.id ? " active" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="doc-content">
        {page ? (
          <div className="doc-section">
            <h2>{page.title}</h2>
            {renderContent(page.body)}
          </div>
        ) : (
          <div className="empty-state">
            <p>Section not found.</p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

function renderContent(body: string): React.ReactNode[] {
  const lines = body.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].startsWith("```")) i++;
      nodes.push(<pre key={nodes.length}><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push(<h3 key={nodes.length}>{line.replace("## ", "")}</h3>);
      i++;
      continue;
    }

    if (line.startsWith("**")) {
      nodes.push(<p key={nodes.length} style={{ fontWeight: 600 }}>{renderInline(line)}</p>);
      i++;
      continue;
    }

    if (line.startsWith("| ")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      nodes.push(renderTable(tableLines, nodes.length));
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={nodes.length} style={{ margin: "8px 0", paddingLeft: 20, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.8 }}>
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    nodes.push(<p key={nodes.length}>{renderInline(line)}</p>);
    i++;
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4, fontSize: 13, color: "var(--accent)" }}>{part.slice(1, -1)}</code>;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
      }
      return bp;
    });
  });
}

function renderTable(tableLines: string[], key: number): React.ReactNode {
  const headerRow = tableLines[0].split("|").filter(Boolean).map((s) => s.trim());
  const bodyRows = tableLines.slice(2).filter((l) => !l.includes("---")).map((l) =>
    l.split("|").filter(Boolean).map((s) => s.trim())
  );

  return (
    <div key={key} className="table-wrap" style={{ margin: "16px 0" }}>
      <table>
        <thead>
          {headerRow.map((h, i) => <th key={i}>{h}</th>)}
        </thead>
        <tbody>
          {bodyRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{renderInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
