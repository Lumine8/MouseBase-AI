# Update & Delete

## Update a Memory

```
PATCH /api/v1/memory/{memory_id}
```

### Request Body

| Field | Type | Description |
|-------|------|-------------|
| `content` | string or null | New text content |
| `external_id` | string or null | New external identifier |
| `metadata` | object or null | New metadata |

At least one field must be provided.

### Response

```json
{
  "id": "550e8400-...",
  "external_id": null,
  "content": "Updated content.",
  "metadata": {},
  "created_at": "2026-07-08T12:00:00Z",
  "updated_at": "2026-07-08T12:01:00Z"
}
```

### Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")
memory = client.update_memory(
    memory_id="550e8400-...",
    content="New content",
    metadata={"key": "value"},
)
print(memory.content)
```

## Delete a Memory

```
DELETE /api/v1/memory/{memory_id}
```

Returns `204 No Content` on success.

### Python SDK

```python
client.delete_memory("550e8400-...")
```

### cURL

```bash
curl -X DELETE http://localhost:8000/api/v1/memory/550e8400-... \
  -H "Authorization: Bearer mb_live_xxx"
```

## Get a Memory

```
GET /api/v1/memory/{memory_id}
```

### Python SDK

```python
memory = client.get_memory("550e8400-...")
print(memory.content)
```
