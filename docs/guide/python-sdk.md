# Python SDK

## Installation

```bash
pip install mousebase
```

## Client

### Basic usage

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")
```

Or via environment variable:

```bash
export MOUSEBASE_API_KEY=mb_live_xxx
```

```python
client = MouseBase()  # reads MOUSEBASE_API_KEY
```

### Context manager

```python
with MouseBase(api_key="mb_live_xxx") as client:
    client.remember(content="Hello")
# client is automatically closed
```

### Configuration

```python
client = MouseBase(
    api_key="mb_live_xxx",
    base_url="https://api.mousebase.ai/v1",  # default
    timeout=30,  # seconds, default 30
)
```

## Methods

### remember

```python
result = client.remember(
    content="The user clicked settings",
    external_id="event_123",       # optional
    metadata={"source": "web"},     # optional
)
# result.memory_id, result.created_at
```

### search

```python
results = client.search(
    query="user settings page",
    top_k=10,  # optional, default 10
)
for r in results.results:
    print(r.score, r.content, r.metadata)
```

### get

```python
memory = client.get("memory-uuid")
print(memory.content, memory.metadata, memory.created_at)
```

### update

```python
memory = client.update(
    "memory-uuid",
    content="Updated text",
    metadata={"key": "new_value"},
    external_id="new_ext_id",
)
```

### delete

```python
client.delete("memory-uuid")
```

### Projects

```python
# Create
project = client.projects.create(name="My App")

# List
projects = client.projects.list()

# Get
project = client.projects.get("project-uuid")

# Update
project = client.projects.update("project-uuid", name="Renamed")

# Delete
client.projects.delete("project-uuid")

# View API key
key = client.projects.view_key("project-uuid")
print(key.api_key)

# Rotate API key
new_project = client.projects.rotate_key("project-uuid")
print(new_project.api_key)
```

### Auth

```python
# Signup
auth = client.signup(email="user@example.com", password="securepass")
print(auth.token, auth.user.email)

# Login
auth = client.login(email="user@example.com", password="securepass")

# Get current user
user = client.me()
print(user.email, user.full_name)
```

## Async client

All methods have async equivalents:

```python
import asyncio
from mousebase import AsyncMouseBase

async def main():
    async with AsyncMouseBase(api_key="mb_live_xxx") as client:
        result = await client.remember(content="Hello")
        print(result.memory_id)

asyncio.run(main())
```

## Error handling

```python
from mousebase import (
    MouseBaseError,
    ValidationError,
    AuthenticationError,
    RateLimitError,
    EmbeddingProviderError,
    InternalError,
)

try:
    client.remember(content="test")
except ValidationError as e:
    print(f"Bad request: {e.message} (code: {e.code})")
except AuthenticationError:
    print("Check your API key")
except RateLimitError:
    print("Slow down")
except EmbeddingProviderError:
    print("Embedding service unavailable")
```

## Retries

The SDK automatically retries on:
- Network errors
- Timeouts
- HTTP 429 (rate limited)
- HTTP 500, 502, 503 (server errors)

Retries use exponential backoff (1s → 2s → 4s, up to 10s max) with a maximum of 3 attempts.

It does **not** retry on 400 (validation error) or 401 (invalid API key).

## Timeout

The default timeout is 30 seconds. Set a custom timeout at construction:

```python
client = MouseBase(api_key="...", timeout=60)
```
