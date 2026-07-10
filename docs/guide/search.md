# Search

Semantically search stored memories by meaning, not keyword matching.

`POST /api/v1/search/`

## Request

```json
{
  "query": "What theme does the user prefer?",
  "top_k": 10
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | `string` | Yes | — | Natural language query |
| `top_k` | `integer` | No | `10` | Maximum results to return (1-100) |

## Response

```json
{
  "results": [
    {
      "id": "mem_abc123",
      "content": "The user prefers dark mode in their IDE.",
      "score": 0.89,
      "metadata": { "source": "preferences" },
      "external_id": null,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

Results are sorted by relevance score (cosine similarity, higher is better).

## SDK Usage

### Python

```python
results = client.search("user preferences", top_k=5)
for r in results.results:
    print(f"  [{r.score:.2f}] {r.content}")
```

### JavaScript

```typescript
const results = await client.search({ query: "user preferences", top_k: 5 });
for (const r of results.results) {
  console.log(`  [${r.score.toFixed(2)}] ${r.content}`);
}
```

### cURL

```bash
curl -X POST https://api.mousebase.dev/api/v1/search/ \
  -H "Authorization: Bearer $MOUSEBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "user preferences", "top_k": 5}'
```
