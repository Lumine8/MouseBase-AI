# MouseBase Python SDK

## Overview

The MouseBase SDK is a small Python client for the v1 API.
It exposes both synchronous and async clients:

```python
from mousebase import MouseBase, AsyncMouseBase
```

It wraps the existing backend endpoints:

- `POST /api/v1/remember/`
- `POST /api/v1/search/`
- `GET /api/v1/memory/{memory_id}`
- `PATCH /api/v1/memory/{memory_id}`
- `DELETE /api/v1/memory/{memory_id}`
- `POST /api/v1/projects/`
- `GET /api/v1/projects/`
- `GET /api/v1/projects/{id}`
- `PATCH /api/v1/projects/{id}`
- `DELETE /api/v1/projects/{id}`
- `POST /api/v1/projects/{id}/api-key/rotate`

## Installation

In this repository, the SDK lives in the same source tree as the backend.
If you package it separately later, the public import stays the same:

```python
from mousebase import MouseBase
```

## Quick Start

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

created = client.remember("The user's favorite language is Python.")
results = client.search("favorite language")
memory = client.get_memory(created.memory_id)
updated = client.update_memory(created.memory_id, content="The user's favorite language is Rust.")
deleted = client.delete_memory(created.memory_id)
```

For async applications:

```python
from mousebase import AsyncMouseBase

async with AsyncMouseBase(api_key="mb_live_xxx") as client:
	created = await client.remember("The user's favorite language is Python.")
	results = await client.search("favorite language")
	project = await client.create_project("My Project")
```

## API

### `MouseBase(api_key, base_url="https://api.mousebase.ai", timeout=httpx.Timeout(...))`

Creates a client with Bearer-token authentication.

The default timeout is:

```python
httpx.Timeout(connect=5, read=30, write=30, pool=5)
```

The SDK also sets a `User-Agent` header like:

```text
mousebase-python/0.1.0 python/3.12.x
```

The client retries transient `502`, `503`, and `504` responses once or twice before failing.

### `AsyncMouseBase(...)`

Async equivalent of `MouseBase`. Use it in async apps and frameworks.

### `remember(content, external_id=None, metadata=None)`

Creates a memory and returns a `RememberResponse` with `memory_id` and `created_at`.

### `search(query, top_k=10)`

Returns a `SearchResponse` with ranked results.

### `get_memory(memory_id)`

Returns the memory record as a `MemoryResponse`.

### `update_memory(memory_id, content=None, external_id=None, metadata=None)`

Updates a memory and returns the updated record.

### `delete_memory(memory_id)`

Deletes a memory. Returns `True` on success.

### `create_project(name, description=None)`

Creates a project for the authenticated owner and returns the new project plus the one-time `api_key`.

### `list_projects()`

Lists all projects owned by the authenticated owner.

### `get_project(project_id)`

Returns one project owned by the authenticated owner.

### `update_project(project_id, name=None, description=None)`

Updates the name or description of a project.

### `delete_project(project_id)`

Deletes a project. Returns `True` on success.

### `rotate_project_key(project_id)`

Generates a new API key for the project and returns the new secret once.

### `projects` sub-resource

All project methods are also exposed via `client.projects` for a grouped API:

```python
project = client.projects.create("My Project")
projects = client.projects.list()
project = client.projects.get(project_id)
project = client.projects.update(project_id, name="New Name")
client.projects.delete(project_id)
key = client.projects.rotate_key(project_id)
```

The same sub-resource is available on async clients: `await client.projects.create(...)`.

### `list_memories()`

Reserved for the future list endpoint. The current backend does not expose a list route yet, so this method raises `NotImplementedError` for now.

## Errors

The SDK converts backend error responses into Python exceptions:

- `AuthenticationError` for `401` and `403`
- `ValidationError` for `400`
- `MemoryNotFoundError` for `404` (memory not found)
- `ProjectNotFoundError` for `404` (project not found)
- `RateLimitError` for `429`
- `ServiceUnavailableError` for `503`
- `APIError` for all other non-success responses

## Notes

`MouseBase` is the synchronous client, `AsyncMouseBase` is the async client, and both share the same request/response models.

## Response Models

All response objects are Pydantic models, so you can access fields directly or export them:

```python
response = client.remember("Hello")
print(response.memory_id)
print(response.model_dump())
```
