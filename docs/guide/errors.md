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
| 401 | `invalid_token` | Access or refresh token is expired, malformed, or revoked |
| 401 | `invalid_credentials` | Email or password is incorrect |
| 401 | `email_not_verified` | Email not yet verified — check inbox or use `resend-verification` |
| 401 | `invalid_reset_token` | Password reset token is invalid or expired |
| 409 | `email_already_exists` | Account with this email already exists |
| 429 | `rate_limited` | You've exceeded the rate limit (60 req/min per IP) |
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
