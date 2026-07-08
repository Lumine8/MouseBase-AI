import { useParams, useNavigate, useLocation } from "react-router-dom";
import PublicNav from "../components/PublicNav";

const sections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "installation", label: "Installation" },
  { id: "authentication", label: "Authentication" },
  { id: "projects", label: "Projects" },
  { id: "remember", label: "Remember" },
  { id: "search", label: "Search" },
  { id: "get", label: "Get" },
  { id: "update-delete", label: "Update & Delete" },
  { id: "python-sdk", label: "Python SDK" },
  { id: "docker", label: "Docker" },
  { id: "deployment", label: "Deployment" },
  { id: "examples", label: "Examples" },
  { id: "errors", label: "Errors" },
  { id: "faq", label: "FAQ" },
];

const content: Record<string, { title: string; body: string }> = {
  "getting-started": {
    title: "Getting Started",
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
    title: "Installation",
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

## Python SDK

\`\`\`bash
pip install mousebase
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
  "authentication": {
    title: "Authentication",
    body: `All API requests require authentication via an API key.

## API Key Format

\`\`\`
mb_live_<key_id>_<secret>
\`\`\`

## Sending the API Key

Include your API key in the \`Authorization\` header:

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/remember/ \\
  -H "Authorization: Bearer mb_live_abc123_def456" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello, world!"}'
\`\`\`

## Python SDK

When using the Python SDK, pass the API key to the client:

\`\`\`python
from mousebase import Client

client = Client(api_key="mb_live_abc123_def456")
\`\`\`

If not provided, the SDK reads the \`MOUSEBASE_API_KEY\` environment variable.`
  },
  "projects": {
    title: "Projects",
    body: `Projects organize your memories and API keys.

## Create a Project

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/projects/ \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Project", "description": "My first project"}'
\`\`\`

## List Projects

\`\`\`bash
curl http://localhost:8000/api/v1/projects/ \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Get a Project

\`\`\`bash
curl http://localhost:8000/api/v1/projects/<id> \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Update a Project

\`\`\`bash
curl -X PATCH http://localhost:8000/api/v1/projects/<id> \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "New Name"}'
\`\`\`

## Delete a Project

\`\`\`bash
curl -X DELETE http://localhost:8000/api/v1/projects/<id> \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

## Rotate API Key

\`\`\`bash
curl -X POST http://localhost:8000/api/v1/projects/<id>/api-key/rotate \\
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

## Python SDK

\`\`\`python
from mousebase import Client

client = Client()
result = client.remember(
    content="The user prefers dark mode.",
    external_id="user_456",
    metadata={"source": "settings"}
)
print(result.id)
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

## Python SDK

\`\`\`python
from mousebase import Client

client = Client()
results = client.search("What framework does the user prefer?", top_k=10)
for r in results:
    print(f"{r.content} (score: {r.score:.2f})")
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

## Python SDK

\`\`\`python
from mousebase import Client

client = Client()
memory = client.get_memory("mem_abc123")
print(memory.content)
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

### Python SDK

\`\`\`python
from mousebase import Client

client = Client()
memory = client.update_memory("mem_abc123", content="Updated content")
\`\`\`

## Delete

\`DELETE /api/v1/memory/<id>\`

### Response

Returns \`204 No Content\` on success.

### Python SDK

\`\`\`python
from mousebase import Client

client = Client()
client.delete_memory("mem_abc123")
\`\`\`

### cURL

\`\`\`bash
curl -X DELETE http://localhost:8000/api/v1/memory/mem_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\``
  },
  "python-sdk": {
    title: "Python SDK",
    body: `The official Python SDK provides a clean, typed interface to the MouseBase API.

## Installation

\`\`\`bash
pip install mousebase
\`\`\`

## Quick Start

\`\`\`python
from mousebase import Client

# Initialize with API key
client = Client(api_key="mb_live_...")

# Store a memory
result = client.remember("The user prefers React over Vue.")
print(result.id)

# Search semantically
results = client.search("What framework does the user like?")
for r in results:
    print(f"{r.content} (score: {r.score})")

# Get a memory by ID
memory = client.get_memory("mem_abc123")

# Update a memory
client.update_memory("mem_abc123", content="Updated content")

# Delete a memory
client.delete_memory("mem_abc123")
\`\`\`

## Environment Variables

The SDK reads these environment variables:

- \`MOUSEBASE_API_KEY\` — Your API key
- \`MOUSEBASE_BASE_URL\` — Server URL (default: \`http://localhost:8000\`)

## API Reference

### \`Client(api_key=None, base_url=None)\`

| Parameter | Default | Description |
|-----------|---------|-------------|
| \`api_key\` | \`MOUSEBASE_API_KEY\` env var | API key for authentication |
| \`base_url\` | \`http://localhost:8000\` | Server base URL |

### Methods

\`\`\`
remember(content, external_id=None, metadata={}) -> RememberResult
search(query, top_k=10) -> list[SearchResult]
get_memory(id) -> Memory
update_memory(id, content=None, metadata=None, external_id=None) -> Memory
delete_memory(id) -> None
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
  "examples": {
    title: "Examples",
    body: `Complete examples for common use cases.

## Basic Usage

\`\`\`python
from mousebase import Client

client = Client()

# Store a memory
client.remember("The user completed onboarding.")

# Search for it
results = client.search("user onboarding")
print(results[0].content)
\`\`\`

## Chatbot with Memory

\`\`\`python
from mousebase import Client

client = Client()

def chat_with_memory(user_input: str, user_id: str) -> str:
    # Store the interaction
    client.remember(
        content=user_input,
        external_id=user_id,
        metadata={"type": "chat"}
    )

    # Retrieve relevant context
    context = client.search(user_input, top_k=5)
    memories = [r.content for r in context]

    # Build response with context
    return f"Based on our conversation: {memories}"
\`\`\`

## RAG Pipeline

\`\`\`python
from mousebase import Client

client = Client()

def rag_query(query: str) -> list[str]:
    results = client.search(query, top_k=10)
    return [r.content for r in results]
\`\`\`

## Customer Support

\`\`\`python
from mousebase import Client

client = Client()

def store_ticket(ticket_id: str, issue: str, resolution: str):
    client.remember(
        content=f"Issue: {issue} | Resolution: {resolution}",
        external_id=ticket_id,
        metadata={"type": "support_ticket"}
    )

def search_similar_issues(issue: str):
    return client.search(issue, top_k=3)
\`\`\`

## AI Agent Memory

\`\`\`python
from mousebase import Client

client = Client()

class AgentMemory:
    def remember_step(self, step: str, agent_id: str):
        client.remember(step, external_id=agent_id, metadata={"type": "step"})

    def recall_context(self, agent_id: str):
        results = client.search(f"agent:{agent_id}", top_k=20)
        return [r.content for r in results]

    def clear_session(self, agent_id: str):
        results = client.search(f"agent:{agent_id}", top_k=100)
        for r in results:
            client.delete_memory(r.id)
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

## Python SDK

The SDK raises exceptions for error responses:

\`\`\`python
from mousebase import Client, APIError

client = Client()

try:
    result = client.get_memory("invalid_id")
except APIError as e:
    print(f"Error {e.code}: {e.message}")
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
};

export default function Documentation() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const inApp = location.pathname.startsWith("/app/");
  const active = section && content[section] ? section : "getting-started";
  const page = content[active];

  return (
    <div>
      {!inApp && <PublicNav />}
      <div className="page doc-layout" style={{ paddingTop: inApp ? 0 : 80 }}>
      <aside className="doc-sidebar">
        <div className="section-title" style={{ marginBottom: 12 }}>Documentation</div>
        <nav className="doc-sidebar-nav">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/docs/${s.id}`)}
              className={`doc-link${active === s.id ? " active" : ""}`}
            >
              {s.label}
            </button>
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
      if (i < lines.length && lines[i].startsWith("```")) i++; // skip closing ```
      nodes.push(<pre key={nodes.length}><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push(<h3 key={nodes.length}>{line.replace("## ", "")}</h3>);
      i++;
      continue;
    }

    if (line.startsWith("**")) {
      // bold text line
      nodes.push(<p key={nodes.length} style={{ fontWeight: 600 }}>{renderInline(line)}</p>);
      i++;
      continue;
    }

    if (line.startsWith("| ")) {
      // table
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

    // Check for bullet list
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
    // Handle bold
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
          <tr>
            {headerRow.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
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
