# Remember

Store a new memory.

## Endpoint

```
POST /remember
```

## Request

```json
{
  "content": "The user clicked on the settings page.",
  "external_id": "event_123",
  "metadata": {
    "source": "clickstream",
    "version": "2.1"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | yes | The text to store (1–8000 characters) |
| `external_id` | string or null | no | Your own identifier for this memory |
| `metadata` | object | no | Arbitrary key-value data (default `{}`) |

## Response — 201

```json
{
  "memory_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-07-09T12:00:00Z"
}
```

## Python SDK

```python
result = client.remember(
    content="User clicked settings",
    external_id="event_123",
    metadata={"source": "clickstream"},
)
print(result.memory_id, result.created_at)
```

## cURL

```bash
curl -X POST https://api.mousebase.ai/v1/remember/ \
  -H "Authorization: Bearer $MOUSEBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "User clicked settings", "metadata": {"source": "clickstream"}}'
```

## Errors

| Status | Code | When |
|--------|------|------|
| 400 | `validation_error` | Request body fails schema validation |
| 401 | `invalid_api_key` | Missing or invalid API key |
| 503 | `embedding_provider_unavailable` | Embedding call failed |
