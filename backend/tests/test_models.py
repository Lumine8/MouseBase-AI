import pytest
from uuid import uuid4, UUID

from sqlalchemy import select

from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.models.usage import Usage


@pytest.mark.asyncio
async def test_project_default_status(client):
    """Projects should default to ACTIVE status."""
    email = f"pstatus-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup.json()["token"]

    create = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Status Test"},
    )
    assert create.status_code == 201
    assert create.json()["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_user_model_expanded_fields(client):
    """User model should have full_name, email_verified, last_login."""
    email = f"expanded-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123", "full_name": "Expanded User"},
    )
    assert signup.status_code == 201
    user = signup.json()["user"]
    assert user["full_name"] == "Expanded User"
    assert user["email_verified"] is True
    assert user["avatar_url"] is None


@pytest.mark.asyncio
async def test_project_api_key_id_format(client):
    """API key IDs should follow the mb_live prefix pattern."""
    email = f"keyfmt-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup.json()["token"]

    create = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Key Format Test"},
    )
    api_key = create.json()["api_key"]
    assert api_key.startswith("mb_live_")
    assert len(api_key.split("_")) == 4


@pytest.mark.asyncio
async def test_project_response_contains_status(client):
    """Project response schema should include status field."""
    email = f"presp-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup.json()["token"]

    create = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Response Test"},
    )
    assert "status" in create.json()
    assert "owner_id" in create.json()
    assert "api_key_id" in create.json()


@pytest.mark.asyncio
async def test_project_create_and_rotate_shows_key_once(client):
    """API key should only be shown on creation and rotation."""
    email = f"keyonce-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup.json()["token"]

    create = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Key Once Test"},
    )
    project_id = create.json()["id"]
    api_key_on_create = create.json()["api_key"]

    get_resp = await client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert "api_key" not in get_resp.json()

    rotate = await client.post(
        f"/api/v1/projects/{project_id}/api-key/rotate",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert rotate.json()["api_key"] != api_key_on_create

    get_after = await client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert "api_key" not in get_after.json()


@pytest.mark.asyncio
async def test_project_empty_update_returns_400(client):
    """PATCH with no changes should return 400."""
    email = f"emptyup-{uuid4().hex[:8]}@example.com"
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "strongpass123"},
    )
    token = signup.json()["token"]

    create = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Empty Update Test"},
    )
    project_id = create.json()["id"]

    response = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_update"
