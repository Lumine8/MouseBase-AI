# Authentication

All API requests require an API key sent via the `Authorization` header.

## Format

```
Authorization: Bearer <API_KEY>
```

API keys follow the format `mb_live_{key_id}_{secret}`.

## Example

```bash
curl -X POST https://api.mousebase.dev/api/v1/remember/ \
  -H "Authorization: Bearer mb_live_abc123_def456" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello world"}'
```

## Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_abc123_def456")
```

You can also set the `MOUSEBASE_API_KEY` environment variable:

```bash
export MOUSEBASE_API_KEY=mb_live_abc123_def456
```

Then create a client without arguments:

```python
client = MouseBase()  # reads MOUSEBASE_API_KEY from env
```

## Error responses

| Status | Code | Meaning |
|--------|------|---------|
| 401 | `invalid_api_key` | Missing, malformed, or unrecognized API key |
