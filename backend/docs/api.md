# MouseBase API

## Authentication

```
Authorization: Bearer <API_KEY>
```

The key resolves to exactly one Project. There is no separate permission tier in v1 — a key is either valid for a project or it isn't.

## Projects API

Projects are owner-scoped. The authenticated project determines the owner for create/list/update/delete/rotate operations.

### POST /projects

Creates a new project for the authenticated owner and returns the API key once.

Request:

```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

Response:

```json
{
  "id": "...",
  "owner_id": "...",
  "name": "My Project",
  "description": "Optional description",
  "api_key_id": "...",
  "created_at": "...",
  "updated_at": "...",
  "api_key": "mb_live_..."
}
```

### GET /projects

Returns a list of projects owned by the authenticated owner.

### GET /projects/{id}

Returns one project owned by the authenticated owner.

### PATCH /projects/{id}

Updates the project name and/or description.

### DELETE /projects/{id}

Deletes the project.

### POST /projects/{id}/api-key/rotate

Generates a new API key for the project and returns the new secret once.

## Content-Type

```
application/json
```

Every endpoint in v1 uses JSON. No other content types are accepted.

---

## POST /remember

### Request

```json
{
  "content": "...",
  "external_id": "...",
  "metadata": {}
}
```

### Response — 201

```json
{
  "memory_id": "...",
  "created_at": "..."
}
```

`created_at` is an RFC 3339 / ISO 8601 UTC timestamp.

Example:

```json
{
  "memory_id": "...",
  "created_at": "2026-07-03T08:43:51Z"
}
```

### Error response shape

Every error below returns this shape:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

`code` is machine-readable and is what SDKs branch on. `message` is for humans/logs — never parsed programmatically.

### Errors

| Status | code                             | When                                                                             |
| ------ | -------------------------------- | -------------------------------------------------------------------------------- |
| 400    | `validation_error`               | Request body fails schema validation (e.g. `content` missing or over 8000 chars) |
| 401    | `invalid_api_key`                | Missing, malformed, or unrecognized API key                                      |
| 429    | `rate_limited`                   | Caller has exceeded their rate limit                                             |
| 503    | `embedding_provider_unavailable` | Embedding call failed or timed out — no Memory row was created                   |
| 500    | `internal_error`                 | Unhandled server error                                                           |

403 and 404 are intentionally not listed — there's no permission tier or ID lookup on this endpoint yet that could produce them. Add them when a real code path needs them (404 will show up naturally with `GET /memory/{id}`).

---

Locked as the SDK contract. Changes here mean changes in every SDK — don't edit casually.

## Embedding Model Changes

The active embedding model is configured through
`settings.EMBEDDING_MODEL`.

Searches are always restricted to embeddings generated
using the currently active model.

Changing the configured embedding model requires a
background re-embedding job for existing memories.
This is intentionally deferred until after the MVP.
