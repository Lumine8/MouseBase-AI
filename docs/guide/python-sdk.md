# Python SDK

The official Python SDK provides a clean, fully-typed interface to the MouseBase API. It supports both synchronous and asynchronous clients.

---

## Installation

```bash
pip install mousebase
```

Requires Python 3.10+.

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

# Search semantically
results = client.search("What theme does the user like?", top_k=5)
for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")

# Clean up
client.close()
```

---

## Sync Client

### Creating a Client

```python
from mousebase import MouseBase

# Option 1: Pass API key directly
client = MouseBase(api_key="mb_live_xxx")

# Option 2: Use environment variable
# export MOUSEBASE_API_KEY="mb_live_xxx"
client = MouseBase()

# Option 3: Custom server URL and timeout
client = MouseBase(
    api_key="mb_live_xxx",
    base_url="https://api.mousebase.dev/api/v1",
    timeout=60,
)
```

The SDK reads `MOUSEBASE_API_KEY` and `MOUSEBASE_BASE_URL` from the environment. It also auto-loads a `.env` file from the current directory if `python-dotenv` is installed.

### Memory Operations

#### remember — Store a Memory

Stores a memory and generates its embedding.

```python
result = client.remember(
    content="The user completed the onboarding flow.",
    external_id="user_789",                       # optional: your own ID
    metadata={"source": "onboarding", "step": 5},  # optional: arbitrary metadata
)
# result.memory_id  -> "mem_abc123"
# result.created_at -> datetime
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `str` | Yes | The text to remember |
| `external_id` | `str` | No | Your own identifier |
| `metadata` | `dict` | No | Arbitrary key-value pairs |

#### search — Semantic Search

Finds memories by semantic similarity, not keyword matching.

```python
results = client.search("What do I know about the user?", top_k=10)

for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")
    if r.metadata:
        print(f"       metadata: {r.metadata}")
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | `str` | Yes | — | Natural language query |
| `top_k` | `int` | No | `10` | Max results to return |

Each `SearchResult` has: `id`, `content`, `score` (cosine similarity), `metadata`, `external_id`.

#### get — Retrieve a Memory

```python
memory = client.get("mem_abc123")
print(memory.content)       # The stored text
print(memory.metadata)      # {"source": "onboarding"}
print(memory.external_id)   # "user_789" or None
print(memory.created_at)    # datetime
print(memory.updated_at)    # datetime
```

#### update — Modify a Memory

Only the fields you provide are updated; omitted fields stay unchanged.

```python
memory = client.update(
    memory_id="mem_abc123",
    content="Updated content",              # optional
    metadata={"edited": True},              # optional — replaces existing metadata
    external_id="new_external_id",          # optional
)
```

#### delete — Remove a Memory

```python
client.delete("mem_abc123")  # Returns None on success
```

Raises `MouseBaseError` if the memory doesn't exist.

### Project Management

Projects group memories and each has its own API key.

```python
# Create a project (returns the API key)
project = client.projects.create(
    name="My Chatbot",
    description="Customer support memories"
)
print(project.api_key)  # "mb_live_..."

# List all projects
projects = client.projects.list()
for p in projects:
    print(p.name, p.id)

# Get a project by ID
project = client.projects.get("proj_abc123")

# Update project metadata
client.projects.update("proj_abc123", name="Renamed", description="New desc")

# Delete a project
client.projects.delete("proj_abc123")

# View the API key (partially masked)
key = client.projects.view_key("proj_abc123")
print(key.api_key)  # "mb_live_...xxxx"

# Rotate the API key (old key becomes invalid)
project = client.projects.rotate_key("proj_abc123")
print(project.api_key)  # New key
```

### Account Management

```python
# Sign up (creates a user account)
auth = client.signup(
    email="user@example.com",
    password="securepassword123",
    full_name="Jane Doe"
)
print(auth.token)   # JWT for subsequent requests
print(auth.user.email)
print(auth.user.full_name)

# Log in to an existing account
auth = client.login(email="user@example.com", password="securepassword123")

# Get the currently authenticated user
user = client.me()
print(user.email, user.email_verified, user.created_at)
```

### Context Manager

The client supports Python's context manager protocol for automatic cleanup:

```python
with MouseBase(api_key="mb_live_xxx") as client:
    result = client.remember("Inside context manager")
# client is automatically closed on exit
```

---

## Async Client

For async environments (FastAPI, asyncio, AIOHTTP, etc.):

```python
import asyncio
from mousebase import AsyncMouseBase

async def main():
    async with AsyncMouseBase(api_key="mb_live_xxx") as client:
        # Memory operations
        result = await client.remember("Async memory")
        results = await client.search("test", top_k=5)
        memory = await client.get("mem_abc123")
        await client.update("mem_abc123", content="Updated")
        await client.delete("mem_abc123")

        # Project management
        project = await client.projects.create(name="Async Project")
        projects = await client.projects.list()

        # Account management
        auth = await client.login(email="user@example.com", password="...")
        user = await client.me()

asyncio.run(main())
```

All methods mirror the sync `MouseBase` client exactly — just add `await` before each call.

---

## Error Handling

Every SDK error is a subclass of `MouseBaseError`.

### Exception Hierarchy

| Exception | HTTP Status | Trigger |
|-----------|-------------|---------|
| `MissingAPIKeyError` | — | No API key provided or found in env |
| `ValidationError` | 400 / 422 | Invalid request payload |
| `AuthenticationError` | 401 | Invalid or expired API key |
| `RateLimitError` | 429 | Too many requests |
| `InternalError` | 500 / 502 | Server-side failure |
| `EmbeddingProviderError` | 503 | Embedding service unavailable |
| `MouseBaseError` | any | Catch-all base exception |

### Example

```python
from mousebase import (
    MouseBase, MouseBaseError,
    MissingAPIKeyError, AuthenticationError,
    ValidationError, RateLimitError
)

client = MouseBase(api_key="mb_live_xxx")

try:
    result = client.remember("Test memory")
except MissingAPIKeyError:
    print("Please set MOUSEBASE_API_KEY")
except AuthenticationError:
    print("Invalid API key")
except ValidationError as e:
    print(f"Validation failed: {e}")
except RateLimitError:
    print("Too many requests — slow down")
except MouseBaseError as e:
    print(f"Error {e.code}: {e.message} (HTTP {e.status_code})")
```

### Automatic Retries

The SDK retries on transient failures with exponential backoff:

| Condition | Retries | Backoff |
|-----------|---------|---------|
| Network errors | up to 3 | 1s → 2s → 4s (max 10s) |
| Timeouts | up to 3 | Same |
| HTTP 429 (rate limit) | up to 3 | Same |
| HTTP 500, 502, 503 | up to 3 | Same |

4xx errors (except 429) and 401 are **not** retried.

---

## Response Models

All responses are Pydantic models with full type hints.

```python
# RememberResponse
result.memory_id   # str
result.created_at  # datetime

# SearchResponse
results.results    # list[SearchResult]

# SearchResult
r.id          # str
r.content     # str
r.score       # float
r.metadata    # dict
r.external_id # str | None

# MemoryResponse
m.id           # str
m.content      # str
m.metadata     # dict
m.external_id  # str | None
m.created_at   # datetime
m.updated_at   # datetime

# ProjectKeyResponse
p.id          # str
p.name        # str
p.description # str | None
p.api_key     # str | None (only on create/rotate)
p.status      # str ("ACTIVE", etc.)
p.created_at  # datetime

# AuthResponse
auth.token  # str (JWT)
auth.user   # UserResponse

# UserResponse
u.id             # str
u.email          # str
u.full_name      # str | None
u.email_verified # bool
u.created_at     # datetime
u.updated_at     # datetime
```

---

## Use Cases

### Chatbot with Persistent Memory

```python
from mousebase import MouseBase
from datetime import datetime

client = MouseBase()

def chat(user_id: str, message: str) -> list[str]:
    # Store the user message
    client.remember(
        content=message,
        external_id=user_id,
        metadata={"role": "user", "timestamp": str(datetime.now())}
    )
    # Retrieve relevant context
    results = client.search(f"{user_id} {message}", top_k=5)
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
            metadata={"type": "agent_step"}
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

def retrieve_context(query: str, top_k: int = 5) -> str:
    results = client.search(query, top_k=top_k)
    return "\n".join(r.content for r in results.results)

# Use with your LLM:
context = retrieve_context("What are the user's preferences?")
prompt = f"Context:\n{context}\n\nAnswer the question based on the context above."
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

def find_similar_issues(description: str) -> list[tuple[str, float]]:
    results = client.search(description, top_k=3)
    return [(r.content, r.score) for r in results.results]
```

---

## Full API Reference

### `MouseBase` (sync)

| Method | Returns | Description |
|--------|---------|-------------|
| `remember(content, external_id, metadata)` | `RememberResponse` | Store a memory |
| `search(query, top_k)` | `SearchResponse` | Semantic search |
| `get(memory_id)` | `MemoryResponse` | Get a memory by ID |
| `update(memory_id, content, metadata, external_id)` | `MemoryResponse` | Update a memory |
| `delete(memory_id)` | `None` | Delete a memory |
| `signup(email, password, full_name)` | `AuthResponse` | Create user account |
| `login(email, password)` | `AuthResponse` | Log in |
| `me()` | `UserResponse` | Get current user |
| `close()` | `None` | Close HTTP session |

### `client.projects`

| Method | Returns | Description |
|--------|---------|-------------|
| `create(name, description)` | `ProjectKeyResponse` | Create project with API key |
| `list()` | `list[ProjectKeyResponse]` | List projects |
| `get(project_id)` | `ProjectKeyResponse` | Get project details |
| `update(project_id, name, description)` | `ProjectResponse` | Update project |
| `delete(project_id)` | `None` | Delete project |
| `view_key(project_id)` | `ApiKeyResponse` | View API key |
| `rotate_key(project_id)` | `ProjectKeyResponse` | Generate new key |

### `AsyncMouseBase`

Same methods as `MouseBase`, all returning coroutines. Use with `await`.

### Exceptions

| Exception | Inherits From |
|-----------|--------------|
| `MouseBaseError` | `Exception` |
| `MissingAPIKeyError` | `MouseBaseError` |
| `ValidationError` | `MouseBaseError` |
| `AuthenticationError` | `MouseBaseError` |
| `RateLimitError` | `MouseBaseError` |
| `EmbeddingProviderError` | `MouseBaseError` |
| `InternalError` | `MouseBaseError` |

All exceptions have `.code` (str), `.message` (str), and `.status_code` (int) attributes.

---

## Examples

Complete runnable examples are in the [examples directory](https://github.com/anomalyco/MouseBase/tree/main/mousebase/examples):

| File | What it demonstrates |
|------|---------------------|
| `notes.py` | Simple notes app with semantic search |
| `rag.py` | RAG pipeline — index documents, retrieve context, build LLM prompt |
| `discord.py` | Discord bot with per-user memory recall |
| `notion.py` | Full CRUD notes app with MouseBase search |
| `customer_support.py` | Support ticket system with similar-issue lookup and customer history |
| `agent_memory.py` | AI agent with `SessionMemory` class for per-session remember/recall/summarize |

Each file can be run directly: `python examples/rag.py` (requires `MOUSEBASE_API_KEY`).

---

## Migration: `Client` → `MouseBase`

The old `Client` class was renamed to `MouseBase`. The API is identical:

```python
# Old
from mousebase import Client
client = Client(api_key="...")

# New
from mousebase import MouseBase
client = MouseBase(api_key="...")
```

Simply replace `Client` with `MouseBase` in your imports.
