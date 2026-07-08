import pytest
from uuid import uuid4

from app.core.security import create_access_token, verify_access_token

AUTH_HEADER = "Authorization"

TEST_EMAIL = f"test-{uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "testpassword123"
TEST_FULL_NAME = "Test User"


def _auth_header(token: str) -> dict[str, str]:
    return {AUTH_HEADER: f"Bearer {token}"}


@pytest.mark.asyncio
async def test_signup_creates_user(client):
    email = f"signup-{uuid4().hex[:8]}@example.com"
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123", "full_name": "New User"},
    )
    assert response.status_code == 201
    body = response.json()
    assert "token" in body
    assert body["user"]["email"] == email
    assert body["user"]["full_name"] == "New User"
    assert body["user"]["email_verified"] is True  # dev mode auto-verifies
    assert "id" in body["user"]


@pytest.mark.asyncio
async def test_signup_creates_subscription(client):
    email = f"sub-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    assert signup_resp.status_code == 201
    token = signup_resp.json()["token"]

    me_resp = await client.get(
        "/api/v1/auth/me",
        headers=_auth_header(token),
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email


@pytest.mark.asyncio
async def test_signup_duplicate_email(client):
    email = f"dup-{uuid4().hex[:8]}@example.com"
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    assert response.status_code == 201

    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "anotherpass123"},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_already_exists"


@pytest.mark.asyncio
async def test_signup_short_password(client):
    email = f"short-{uuid4().hex[:8]}@example.com"
    response = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "short"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    email = f"login-{uuid4().hex[:8]}@example.com"
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "strongpass123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "token" in body
    assert body["user"]["email"] == email


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    email = f"wrongpw-{uuid4().hex[:8]}@example.com"
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "somepass123"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_get_me_authenticated(client):
    email = f"me-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers=_auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["email"] == email


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = await client.get(
        "/api/v1/auth/me",
        headers=_auth_header("invalid.jwt.token"),
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_project_with_jwt(client):
    email = f"jwt-proj-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    response = await client.post(
        "/api/v1/projects/",
        headers=_auth_header(token),
        json={"name": "JWT Project", "description": "Created with JWT"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "JWT Project"
    assert body["api_key"].startswith("mb_live_")
    assert "status" in body
    assert body["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_list_projects_with_jwt(client):
    email = f"jwt-list-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    await client.post(
        "/api/v1/projects/",
        headers=_auth_header(token),
        json={"name": "Project 1"},
    )
    await client.post(
        "/api/v1/projects/",
        headers=_auth_header(token),
        json={"name": "Project 2"},
    )

    response = await client.get(
        "/api/v1/projects/",
        headers=_auth_header(token),
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    names = [p["name"] for p in body]
    assert "Project 1" in names
    assert "Project 2" in names


@pytest.mark.asyncio
async def test_project_lifecycle_with_jwt(client):
    email = f"jwt-life-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]
    headers = _auth_header(token)

    create_resp = await client.post(
        "/api/v1/projects/",
        headers=headers,
        json={"name": "Lifecycle Project", "description": "Test lifecycle"},
    )
    assert create_resp.status_code == 201
    project_id = create_resp.json()["id"]

    get_resp = await client.get(
        f"/api/v1/projects/{project_id}",
        headers=headers,
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Lifecycle Project"

    update_resp = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={"name": "Updated Project"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Project"

    rotate_resp = await client.post(
        f"/api/v1/projects/{project_id}/api-key/rotate",
        headers=headers,
    )
    assert rotate_resp.status_code == 200
    assert rotate_resp.json()["api_key"] != create_resp.json()["api_key"]

    delete_resp = await client.delete(
        f"/api/v1/projects/{project_id}",
        headers=headers,
    )
    assert delete_resp.status_code == 204

    get_deleted = await client.get(
        f"/api/v1/projects/{project_id}",
        headers=headers,
    )
    assert get_deleted.status_code == 404


@pytest.mark.asyncio
async def test_projects_with_api_key_backward_compat(client):
    """Existing API-key-only users can still access project endpoints."""
    email = f"backcomp-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    create_resp = await client.post(
        "/api/v1/projects/",
        headers=_auth_header(token),
        json={"name": "Compat Project"},
    )
    api_key = create_resp.json()["api_key"]

    list_resp = await client.get(
        "/api/v1/projects/",
        headers=_auth_header(api_key),
    )
    assert list_resp.status_code == 200
    assert any(p["api_key_id"] == create_resp.json()["api_key_id"] for p in list_resp.json())


@pytest.mark.asyncio
async def test_api_key_auth_still_works_for_memory_ops(client):
    """The memory API endpoints still require API key (not JWT)."""
    email = f"apikey-mem-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    create_resp = await client.post(
        "/api/v1/projects/",
        headers=_auth_header(token),
        json={"name": "Memory Test Project"},
    )
    api_key = create_resp.json()["api_key"]

    remember_resp = await client.post(
        "/api/v1/remember/",
        headers=_auth_header(api_key),
        json={"content": "Test memory via API key"},
    )
    assert remember_resp.status_code == 201

    memory_id = remember_resp.json()["id"]

    get_resp = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers=_auth_header(api_key),
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["content"] == "Test memory via API key"


@pytest.mark.asyncio
async def test_jwt_token_cannot_access_memory_api(client):
    """JWT tokens should not work for memory API endpoints."""
    email = f"jwt-no-mem-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    response = await client.post(
        "/api/v1/remember/",
        headers=_auth_header(token),
        json={"content": "Should fail"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_access_token_and_verify(client):
    from app.core.security import create_access_token, verify_access_token
    from uuid import UUID

    user_id = uuid4()
    token = create_access_token(user_id)
    decoded = verify_access_token(token)
    assert decoded == user_id


@pytest.mark.asyncio
async def test_verify_email_endpoint(client):
    email = f"verify-{uuid4().hex[:8]}@example.com"
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup_resp.json()["token"]

    response = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": token},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email verified successfully"


@pytest.mark.asyncio
async def test_verify_email_invalid_token(client):
    response = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": "invalid.jwt.here"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"
