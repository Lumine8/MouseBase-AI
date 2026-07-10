# Authentication

MouseBase supports two authentication methods: **API keys** (for project-scoped access) and **JWT tokens** (for user account access).

## API Key Auth

All project-scoped API requests require an API key sent via the `Authorization` header.

### Format

```
Authorization: Bearer mb_live_{key_id}_{secret}
```

### Example

```bash
curl -X POST https://api.mousebase.dev/api/v1/remember/ \
  -H "Authorization: Bearer mb_live_abc123_def456" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello world"}'
```

### Python SDK

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

## JWT Auth (User Accounts)

JWT tokens are used for user-level operations like signup, login, and account management.

### Sign Up

```bash
curl -X POST https://api.mousebase.dev/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123", "full_name": "Jane Doe"}'
```

Response:
```json
{
  "token": "eyJ...",
  "refresh_token": "abc123...",
  "user": { "id": "...", "email": "user@example.com", "email_verified": false }
}
```

### Log In

```bash
curl -X POST https://api.mousebase.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

### Access & Refresh Tokens

| Token | Expiry | Usage |
|-------|--------|-------|
| `token` | 15 minutes | Bearer token for authenticated API requests |
| `refresh_token` | 30 days | One-time use to get a new token pair |

### Refreshing Tokens

When your access token expires, use the refresh token:

```bash
curl -X POST https://api.mousebase.dev/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_refresh_token"}'
```

Returns a new access token + new refresh token. The old refresh token is revoked.

### Email Verification

On signup, a verification email is sent with a 24-hour link. Verify your email:

```bash
curl -X POST https://api.mousebase.dev/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification_token"}'
```

### Password Reset

```bash
# Request a reset link
curl -X POST https://api.mousebase.dev/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Reset password with token (1-hour expiry)
curl -X POST https://api.mousebase.dev/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "reset_token", "password": "new_password"}'
```

### Session Management

```bash
# List active sessions
curl -X GET https://api.mousebase.dev/api/v1/auth/sessions \
  -H "Authorization: Bearer eyJ..."

# Revoke a specific session
curl -X DELETE https://api.mousebase.dev/api/v1/auth/sessions/{session_id} \
  -H "Authorization: Bearer eyJ..."

# Revoke all sessions (sign out everywhere)
curl -X DELETE https://api.mousebase.dev/api/v1/auth/sessions \
  -H "Authorization: Bearer eyJ..."
```

## Error responses

| Status | Code | Meaning |
|--------|------|---------|
| 401 | `invalid_api_key` | Missing, malformed, or unrecognized API key |
| 401 | `invalid_token` | Missing, expired, or invalid JWT token |
| 401 | `invalid_credentials` | Wrong email or password |
| 403 | `email_not_verified` | Email not yet verified |
| 409 | `email_already_exists` | Account with this email already exists |
