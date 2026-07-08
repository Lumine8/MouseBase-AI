# Remember

Store a new semantic memory.

## Endpoint

```
POST /api/v1/remember/
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | The text to store (1-8000 chars) |
| `external_id` | string or null | No | Optional external identifier |
| `metadata` | object | No | Arbitrary key-value metadata |

## Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-07-08T12:00:00Z"
}
```

## Examples

### Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

result = client.remember(
    content="The user clicked the settings page.",
    external_id="event_123",
    metadata={"source": "clickstream", "page": "/settings"}
)
print(result.id)  # "550e8400-..."
```

### cURL

```bash
curl -X POST http://localhost:8000/api/v1/remember/ \
  -H "Authorization: Bearer mb_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"content": "The user clicked the settings page."}'
```

### JavaScript

```javascript
const res = await fetch("http://localhost:8000/api/v1/remember/", {
  method: "POST",
  headers: {
    Authorization: "Bearer mb_live_xxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ content: "The user clicked the settings page." }),
});
const data = await res.json();
console.log(data.id);
```
