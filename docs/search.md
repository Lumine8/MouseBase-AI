# Search

Semantically search stored memories.

## Endpoint

```
POST /api/v1/search/
```

## Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | Yes | — | The search query (1-8000 chars) |
| `top_k` | integer | No | 10 | Number of results (1-100) |

## Response

```json
{
  "results": [
    {
      "id": "550e8400-...",
      "external_id": null,
      "content": "The user clicked the settings page.",
      "metadata": {},
      "score": 0.89
    }
  ]
}
```

Results are sorted by relevance score (0.0 to 1.0, higher = more relevant).

## Examples

### Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

results = client.search("user settings", top_k=5)
for r in results:
    print(f"{r.content} (score: {r.score:.2f})")
```

### cURL

```bash
curl -X POST http://localhost:8000/api/v1/search/ \
  -H "Authorization: Bearer mb_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "user settings", "top_k": 5}'
```

### Filtering by score

Results below the minimum score threshold are automatically excluded. Configure via `MIN_SCORE` in your backend settings.
