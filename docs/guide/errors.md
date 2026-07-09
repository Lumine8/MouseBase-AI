# Errors

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "error_code_string",
    "message": "Human-readable description"
  }
}
```

`code` is machine-readable. `message` is for humans and logs.

## Error codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `validation_error` | Request body failed validation |
| 401 | `invalid_api_key` | API key is missing, malformed, or invalid |
| 429 | `rate_limited` | You've exceeded the rate limit |
| 500 | `internal_error` | Unexpected server error |
| 503 | `embedding_provider_unavailable` | Embedding service call failed |

## SDK exceptions

```python
MouseBaseError           # base class for all errors
├── ValidationError      # 400
├── AuthenticationError  # 401
├── RateLimitError       # 429
├── InternalError        # 500/502
└── EmbeddingProviderError  # 503
```

Each exception carries the `code` and `message` from the API response, plus `status_code`.
