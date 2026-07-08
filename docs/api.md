# REST API Reference

Base URL: `http://localhost:8000/api/v1`

Authentication: `Authorization: Bearer mb_live_xxx`

## Endpoints

### Remember

```
POST /remember/
```

### Search

```
POST /search/
```

### Memories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/memory/{id}` | Get a memory |
| `PATCH` | `/memory/{id}` | Update a memory |
| `DELETE` | `/memory/{id}` | Delete a memory |

### Projects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/` | List projects |
| `POST` | `/projects/` | Create a project |
| `GET` | `/projects/{id}` | Get a project |
| `PATCH` | `/projects/{id}` | Update a project |
| `DELETE` | `/projects/{id}` | Delete a project |
| `POST` | `/projects/{id}/api-key/rotate` | Rotate API key |

## Error Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "memory_not_found",
    "message": "Memory not found"
  }
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_api_key` | 401 | Invalid or missing API key |
| `memory_not_found` | 404 | Memory does not exist |
| `project_not_found` | 404 | Project does not exist |
| `empty_update` | 400 | No fields provided for update |
| `embedding_unavailable` | 503 | Embedding service is down |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected error |
