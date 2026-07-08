# Authentication

MouseBase uses API key authentication. Include your key in the `Authorization` header:

```
Authorization: Bearer mb_live_xxxxxxxxxx
```

## Getting an API Key

### Via the Dashboard

1. Start the frontend: `npm run dev` (from `frontend/`)
2. Log in with your API key (use the one from `scripts/create_dev_project.py`)
3. Navigate to **Projects** → **Create Project**
4. Copy the key shown (it's displayed only once)

### Via the API

```bash
curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer mb_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project"}'
```

## SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxxxxxxxxx")
```

## Error Responses

Invalid or missing API keys return:

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "Invalid API key"
  }
}
```
