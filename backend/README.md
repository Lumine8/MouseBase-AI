# MouseBase Python SDK

## Quick Start

### Sync

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")
memory = client.remember("Sankar likes Python.")
results = client.search("favorite language")
```

### Async

```python
from mousebase import AsyncMouseBase

async with AsyncMouseBase(api_key="mb_live_xxx") as client:
    memory = await client.remember("Hello")
    results = await client.search("favorite language")
```

## Core Methods

- `remember(content, external_id=None, metadata=None)`
- `search(query, top_k=10)`
- `get_memory(memory_id)`
- `update_memory(memory_id, content=None, external_id=None, metadata=None)`
- `delete_memory(memory_id)`

`delete_memory()` returns `True` on success.

`list_memories()` is reserved for a future list endpoint and currently raises `NotImplementedError`.
