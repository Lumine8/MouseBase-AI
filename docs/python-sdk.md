# Python SDK

## Installation

```bash
pip install mousebase
```

## Quick Start

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

# Store
result = client.remember("Hello, world!")
print(f"Stored: {result.id}")

# Search
results = client.search("hello")
for r in results:
    print(f"  {r.content} ({r.score:.2f})")

# Get
memory = client.get_memory(result.id)
print(f"Content: {memory.content}")

# Update
client.update_memory(result.id, content="Updated!")

# Delete
client.delete_memory(result.id)
```

## Async Support

```python
import asyncio
from mousebase import AsyncMouseBase

async def main():
    async with AsyncMouseBase(api_key="mb_live_xxx") as client:
        result = await client.remember("Async memory")
        results = await client.search("async")
        print(results)

asyncio.run(main())
```

## API Reference

### `MouseBase(api_key: str, base_url: str = "http://localhost:8000")`

| Method | Description |
|--------|-------------|
| `remember(content, external_id=None, metadata={})` | Store a memory |
| `search(query, top_k=10)` | Semantic search |
| `get_memory(memory_id)` | Get a memory by ID |
| `update_memory(memory_id, content=None, metadata=None, external_id=None)` | Update a memory |
| `delete_memory(memory_id)` | Delete a memory |
| `list_projects()` | List all projects |
| `create_project(name, description=None)` | Create a project |
| `get_project(project_id)` | Get a project |
| `update_project(project_id, name=None, description=None)` | Update a project |
| `delete_project(project_id)` | Delete a project |
| `rotate_key(project_id)` | Rotate API key |

### Response Models

| Model | Fields |
|-------|--------|
| `RememberResponse` | `id: str`, `created_at: datetime` |
| `SearchResult` | `id: str`, `external_id: str`, `content: str`, `metadata: dict`, `score: float` |
| `Memory` | `id: str`, `external_id: str`, `content: str`, `metadata: dict`, `created_at: datetime`, `updated_at: datetime` |
| `Project` | `id: str`, `name: str`, `description: str`, `api_key_id: str`, `created_at: datetime` |
| `ProjectWithKey` | (inherits Project) + `api_key: str` |
