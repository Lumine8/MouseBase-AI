<div align="center">
  <img src="https://raw.githubusercontent.com/Lumine8/MouseBase-AI/main/frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="120" />
  <h1>MouseBase Python SDK</h1>
</div>

[![PyPI version](https://img.shields.io/pypi/v/mousebase)](https://pypi.org/project/mousebase/)
[![Python versions](https://img.shields.io/pypi/pyversions/mousebase)](https://pypi.org/project/mousebase/)
[![License](https://img.shields.io/pypi/l/mousebase)](https://github.com/Lumine8/MouseBase-AI/blob/main/LICENSE)

Official Python SDK for [MouseBase](https://mousebase.ai) — persistent memory infrastructure for AI applications.

Store, retrieve, and semantically search memories using vector embeddings. Works with any LLM or AI agent.

---

## Installation

```bash
pip install mousebase
```

Python 3.10 or higher is required.

---

## Quick Start

```python
from mousebase import MouseBase

# Initialize with your API key
client = MouseBase(api_key="mb_live_xxx")

# Store a memory
result = client.remember(
    content="User prefers dark mode in their IDE.",
    metadata={"source": "preferences", "user_id": "123"}
)
print(f"Stored memory: {result.memory_id}")
# Stored memory: mem_abc123

# Search semantically
results = client.search("What theme does the user like?", top_k=5)
for r in results.results:
    print(f"{r.content} (score: {r.score:.2f})")
# User prefers dark mode in their IDE. (score: 0.92)
```

## Clients

MouseBase provides two clients:

| Client | When to use |
|---|---|
| `MouseBase` | Standard synchronous usage — scripts, CLI tools, simple apps |
| `AsyncMouseBase` | Async/await usage — FastAPI, async web frameworks, concurrent workloads |

---

## Sync Client (`MouseBase`)

### Creating a Client

```python
from mousebase import MouseBase

# Option 1: Pass the API key directly
client = MouseBase(api_key="mb_live_xxx")

# Option 2: Use environment variable (recommended)
# export MOUSEBASE_API_KEY="mb_live_xxx"
client = MouseBase()

# Option 3: Custom server URL
client = MouseBase(
    api_key="mb_live_xxx",
    base_url="https://your-instance.com/api/v1",
    timeout=60  # seconds, default is 30
)
```

The SDK also reads from a `.env` file in the current working directory if `python-dotenv` is available.

### `remember()` — Store a Memory

Stores a new memory with semantic embedding.

```python
result = client.remember(
    content="The user completed the onboarding flow.",
    external_id="user_789",                    # optional: your own ID
    metadata={"source": "onboarding", "step": 5}  # optional: arbitrary key-value pairs
)
# result.memory_id -> "mem_abc123"
# result.created_at -> datetime object
```

**Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `content` | `str` | Yes | The text content to remember |
| `external_id` | `str` | No | Your own identifier for this memory |
| `metadata` | `dict` | No | Arbitrary key-value metadata |

### `search()` — Semantic Search

Finds memories that are semantically similar to your query.

```python
results = client.search("What do I know about the user?", top_k=10)

for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")
    if r.metadata:
        print(f"       metadata: {r.metadata}")
```

**Parameters:**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `str` | Yes | — | The search query |
| `top_k` | `int` | No | `10` | Number of results to return |

**Response:** `SearchResponse.results` is a list of `SearchResult` objects with: `id`, `content`, `score`, `metadata`, `external_id`.

### `get()` — Retrieve a Memory

```python
memory = client.get("mem_abc123")
print(memory.content)        # "The user completed the onboarding flow."
print(memory.metadata)       # {"source": "onboarding"}
print(memory.created_at)     # datetime
print(memory.external_id)    # "user_789" or None
```

### `update()` — Update a Memory

```python
memory = client.update(
    memory_id="mem_abc123",
    content="Updated content here",            # optional: new text
    metadata={"edited": True, "version": 2},   # optional: replaces existing metadata
    external_id="new_external_id"              # optional: new external ID
)
```

Only the fields you provide are updated. Fields you omit remain unchanged.

### `delete()` — Delete a Memory

```python
client.delete("mem_abc123")  # returns None on success
```

### Project Management (`client.projects`)

Projects isolate memories and API keys. Each project has its own API key.

```python
# Create a project
project = client.projects.create(
    name="My Chatbot",
    description="Memories for my customer support chatbot"
)
project.api_key  # "mb_live_..." — the project's API key

# List projects
projects = client.projects.list()

# Get a project
project = client.projects.get("proj_abc123")

# Update a project
project = client.projects.update("proj_abc123", name="New Name", description="Updated")

# Delete a project
client.projects.delete("proj_abc123")

# View API key (masked)
key = client.projects.view_key("proj_abc123")
key.api_key  # "mb_live_...xxxx"

# Rotate API key (generates a new one, old one is invalidated)
project = client.projects.rotate_key("proj_abc123")
project.api_key  # new "mb_live_..."
```

### Account Management

```python
# Sign up (creates a new user account)
auth = client.signup(
    email="user@example.com",
    password="securepassword123",
    full_name="Jane Doe"
)
auth.token      # JWT token for authentication
auth.user       # UserResponse object

# Log in
auth = client.login(email="user@example.com", password="securepassword123")

# Get current user info
user = client.me()
user.email       # "user@example.com"
user.full_name   # "Jane Doe"
user.created_at  # datetime
```

### Context Manager

The client can be used as a context manager for automatic cleanup:

```python
with MouseBase(api_key="mb_live_xxx") as client:
    result = client.remember("Hello, world!")
    # client is automatically closed on exit
```

---

## Async Client (`AsyncMouseBase`)

For async environments (FastAPI, asyncio, etc.), use `AsyncMouseBase`. All methods are identical to the sync client but use `async`/`await`.

```python
import asyncio
from mousebase import AsyncMouseBase

async def main():
    client = AsyncMouseBase(api_key="mb_live_xxx")

    # Store a memory
    result = await client.remember("Async is great!")
    print(f"Stored: {result.memory_id}")

    # Search
    results = await client.search("What's great?", top_k=5)
    for r in results.results:
        print(f"  [{r.score:.2f}] {r.content}")

    # Project management (all async)
    project = await client.projects.create(name="Async Project")

    # Account management
    auth = await client.login(email="user@example.com", password="...")
    user = await client.me()

    await client.close()

asyncio.run(main())
```

### Async Context Manager

```python
async with AsyncMouseBase(api_key="mb_live_xxx") as client:
    result = await client.remember("Inside context manager")
```

---

## Error Handling

The SDK raises typed exceptions for different error conditions.

```python
from mousebase import (
    MouseBase,
    MouseBaseError,
    MissingAPIKeyError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    EmbeddingProviderError,
    InternalError,
)
```

| Exception | HTTP Status | When it occurs |
|---|---|---|
| `MissingAPIKeyError` | — | No API key provided or found in environment |
| `AuthenticationError` | 401 | Invalid or expired API key |
| `ValidationError` | 400/422 | Invalid request payload |
| `RateLimitError` | 429 | Too many requests |
| `EmbeddingProviderError` | 503 | Embedding service unavailable |
| `InternalError` | 500/502 | Server error |
| `MouseBaseError` | any | Catch-all for all SDK errors |

```python
client = MouseBase(api_key="mb_live_xxx")

try:
    result = client.remember(content="Test")
except MissingAPIKeyError:
    print("Please set your MOUSEBASE_API_KEY")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Slow down!")
except MouseBaseError as e:
    print(f"Error {e.code}: {e.message} (HTTP {e.status_code})")
```

### Automatic Retries

The SDK automatically retries on:
- Network errors and timeouts
- HTTP 429 (rate limited)
- HTTP 500, 502, 503 (server errors)

Retry strategy: exponential backoff (1s → 2s → 4s → max 10s), up to 3 attempts.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MOUSEBASE_API_KEY` | — | Your API key (required if not passed directly) |
| `MOUSEBASE_BASE_URL` | `https://api.mousebase.ai/v1` | Custom server URL |

### Client Constructor

```python
MouseBase(
    api_key: str | None = None,     # API key or MOUSEBASE_API_KEY env var
    base_url: str | None = None,    # Server URL or MOUSEBASE_BASE_URL env var
    timeout: int = 30,              # HTTP request timeout in seconds
)
```

---

## Complete API Reference

### Sync: `MouseBase`

| Method | Returns | Description |
|---|---|---|
| `remember(content, external_id, metadata)` | `RememberResponse` | Store a new memory |
| `search(query, top_k)` | `SearchResponse` | Semantic search |
| `get(memory_id)` | `MemoryResponse` | Retrieve a memory by ID |
| `update(memory_id, content, metadata, external_id)` | `MemoryResponse` | Update a memory |
| `delete(memory_id)` | `None` | Delete a memory |
| `signup(email, password, full_name)` | `AuthResponse` | Create account |
| `login(email, password)` | `AuthResponse` | Log in |
| `me()` | `UserResponse` | Get current user |
| `close()` | `None` | Close HTTP session |

### Sync: `client.projects`

| Method | Returns | Description |
|---|---|---|
| `create(name, description)` | `ProjectKeyResponse` | Create project with API key |
| `list()` | `list[ProjectKeyResponse]` | List all projects |
| `get(project_id)` | `ProjectKeyResponse` | Get project details |
| `update(project_id, name, description)` | `ProjectResponse` | Update project |
| `delete(project_id)` | `None` | Delete project |
| `view_key(project_id)` | `ApiKeyResponse` | View project API key |
| `rotate_key(project_id)` | `ProjectKeyResponse` | Rotate API key |

### Async: `AsyncMouseBase`

Same methods as `MouseBase`, all returning coroutines. Prefix each call with `await`.

### Response Models

| Model | Fields |
|---|---|
| `RememberResponse` | `memory_id: str`, `created_at: datetime` |
| `SearchResponse` | `results: list[SearchResult]` |
| `SearchResult` | `id: str`, `content: str`, `score: float`, `metadata: dict`, `external_id: str` |
| `MemoryResponse` | `id: str`, `content: str`, `metadata: dict`, `external_id: str`, `created_at: datetime`, `updated_at: datetime` |
| `ProjectKeyResponse` | `id: str`, `name: str`, `description: str`, `api_key: str`, `status: str`, `created_at: datetime` |
| `ProjectResponse` | Same as `ProjectKeyResponse` but without `api_key` |
| `ApiKeyResponse` | `project_id: str`, `api_key: str` |
| `AuthResponse` | `token: str`, `user: UserResponse` |
| `UserResponse` | `id: str`, `email: str`, `full_name: str`, `email_verified: bool`, `created_at: datetime` |

---

## Use Cases

### Chatbot with Persistent Memory

```python
from mousebase import MouseBase

client = MouseBase()

def chat(user_id: str, message: str) -> list[str]:
    # Store the user's message
    client.remember(
        content=message,
        external_id=user_id,
        metadata={"role": "user", "timestamp": str(datetime.now())}
    )

    # Retrieve relevant context from past conversations
    results = client.search(f"user:{user_id} {message}", top_k=5)
    return [r.content for r in results.results]
```

### AI Agent Memory

```python
from mousebase import MouseBase

client = MouseBase()

class AgentMemory:
    def store_step(self, agent_id: str, step: str, result: str):
        client.remember(
            content=f"Step: {step}\nResult: {result}",
            external_id=agent_id,
            metadata={"type": "agent_step", "agent_id": agent_id}
        )

    def recall_context(self, agent_id: str, task: str) -> list[str]:
        results = client.search(f"{agent_id} {task}", top_k=20)
        return [r.content for r in results.results]

    def clear_session(self, agent_id: str):
        results = client.search(agent_id, top_k=100)
        for r in results.results:
            client.delete(r.id)
```

### RAG Pipeline

```python
from mousebase import MouseBase

client = MouseBase()

def rag_retrieve(query: str, top_k: int = 5) -> list[str]:
    results = client.search(query, top_k=top_k)
    return [r.content for r in results.results]

# Use with your LLM:
context = "\n".join(rag_retrieve("What are the user's preferences?"))
prompt = f"Based on this context:\n{context}\n\nAnswer the user's question."
```

### Customer Support Knowledge Base

```python
from mousebase import MouseBase

client = MouseBase()

def store_resolution(ticket_id: str, issue: str, resolution: str):
    client.remember(
        content=f"Issue: {issue}\nResolution: {resolution}",
        external_id=ticket_id,
        metadata={"type": "support_ticket"}
    )

def search_similar_issues(description: str) -> list[tuple[str, float]]:
    results = client.search(description, top_k=3)
    return [(r.content, r.score) for r in results.results]
```

---

## Examples

Complete runnable examples are in the [examples directory](examples/):

- `notes.py` — Simple notes app with semantic search
- `rag.py` — RAG pipeline (index → retrieve → LLM prompt)
- `discord.py` — Discord bot with per-user memory via `!recall`
- `notion.py` — Full CRUD notes app with MouseBase search
- `customer_support.py` — Support ticket system with similar-issue lookup
- `agent_memory.py` — AI agent with session-based memory management

Run any example with: `python examples/rag.py` (requires `MOUSEBASE_API_KEY`).

---

## Migration: `Client` → `MouseBase`

If you were using the older `Client` class, it has been renamed to `MouseBase`. The API is identical — simply replace `Client` with `MouseBase` in your imports:

```python
# Old
from mousebase import Client
client = Client(api_key="...")

# New
from mousebase import MouseBase
client = MouseBase(api_key="...")
```

---

## License

MIT
