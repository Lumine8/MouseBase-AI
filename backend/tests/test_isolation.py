import time
import uuid

import pytest


def _uid():
    return uuid.uuid4().hex[:8]


@pytest.mark.asyncio
async def test_cross_project_cannot_read_memory(client):
    """User A's memory cannot be read with User B's API key."""
    ts = int(time.time())
    email_a = f"isolation_a_{ts}@test.mousebase.dev"
    email_b = f"isolation_b_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    # Create two users
    resp_a = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_a, "password": pw},
    )
    assert resp_a.status_code == 201
    key_a = resp_a.json()["token"]

    resp_b = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_b, "password": pw},
    )
    assert resp_b.status_code == 201
    key_b = resp_b.json()["token"]

    # Create a project for each user
    proj_a = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_a}"},
        json={"name": f"Isolation Project A {_uid()}"},
    )
    assert proj_a.status_code == 201
    api_key_a = proj_a.json()["api_key"]

    proj_b = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_b}"},
        json={"name": f"Isolation Project B {_uid()}"},
    )
    assert proj_b.status_code == 201
    api_key_b = proj_b.json()["api_key"]

    # Store a memory in project A
    mem_a = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key_a}"},
        json={"content": "Secret memory belonging to user A"},
    )
    assert mem_a.status_code == 201
    memory_id = mem_a.json()["id"]

    # User B cannot read User A's memory
    resp = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key_b}"},
    )
    assert resp.status_code == 404

    # User B cannot update User A's memory
    resp = await client.patch(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key_b}"},
        json={"content": "Hacked content"},
    )
    assert resp.status_code == 404

    # User B cannot delete User A's memory
    resp = await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key_b}"},
    )
    assert resp.status_code == 404

    # User A can still read their own memory
    resp = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key_a}"},
    )
    assert resp.status_code == 200
    assert resp.json()["content"] == "Secret memory belonging to user A"

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj_a.json()['id']}",
        headers={"Authorization": f"Bearer {key_a}"},
    )
    await client.delete(
        f"/api/v1/projects/{proj_b.json()['id']}",
        headers={"Authorization": f"Bearer {key_b}"},
    )


@pytest.mark.asyncio
async def test_cross_project_search_isolation(client):
    """User B's search does not return User A's memories."""
    ts = int(time.time())
    email_a = f"search_a_{ts}@test.mousebase.dev"
    email_b = f"search_b_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp_a = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_a, "password": pw},
    )
    key_a = resp_a.json()["token"]

    resp_b = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_b, "password": pw},
    )
    key_b = resp_b.json()["token"]

    proj_a = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_a}"},
        json={"name": f"Search Iso A {_uid()}"},
    )
    api_key_a = proj_a.json()["api_key"]

    proj_b = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_b}"},
        json={"name": f"Search Iso B {_uid()}"},
    )
    api_key_b = proj_b.json()["api_key"]

    # Store unique memory in A
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key_a}"},
        json={"content": "User A's confidential project plan for Q4"},
    )

    # Search from B should NOT find A's memory
    resp = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {api_key_b}"},
        json={"query": "confidential project plan Q4", "top_k": 10},
    )
    assert resp.status_code == 200
    results = resp.json().get("results", [])
    for r in results:
        assert "confidential" not in r.get("content", "").lower()

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj_a.json()['id']}",
        headers={"Authorization": f"Bearer {key_a}"},
    )
    await client.delete(
        f"/api/v1/projects/{proj_b.json()['id']}",
        headers={"Authorization": f"Bearer {key_b}"},
    )


@pytest.mark.asyncio
async def test_user_cannot_access_other_users_projects(client):
    """User B cannot list, get, or delete User A's projects."""
    ts = int(time.time())
    email_a = f"proj_a_{ts}@test.mousebase.dev"
    email_b = f"proj_b_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp_a = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_a, "password": pw},
    )
    key_a = resp_a.json()["token"]

    resp_b = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_b, "password": pw},
    )
    key_b = resp_b.json()["token"]

    proj_a = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_a}"},
        json={"name": f"Private Project {_uid()}"},
    )
    project_id = proj_a.json()["id"]

    # User B cannot get User A's project
    resp = await client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp.status_code in (404, 403)

    # User B cannot delete User A's project
    resp = await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp.status_code in (404, 403)

    # User B's project list does not include User A's project
    resp = await client.get(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {key_b}"},
    )
    assert resp.status_code == 200
    project_ids = [p["id"] for p in resp.json()]
    assert project_id not in project_ids

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {key_a}"},
    )


@pytest.mark.asyncio
async def test_rotated_key_old_key_rejected(client):
    """After key rotation, the old API key no longer works."""
    ts = int(time.time())
    email = f"rotate_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Rotate Test {_uid()}"},
    )
    old_key = proj.json()["api_key"]
    project_id = proj.json()["id"]

    # Store memory with old key
    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {old_key}"},
        json={"content": "Stored with old key"},
    )
    assert mem.status_code == 201

    # Rotate key
    rotate_resp = await client.post(
        f"/api/v1/projects/{project_id}/rotate-key",
        headers={"Authorization": f"Bearer {jwt}"},
    )
    assert rotate_resp.status_code == 200
    new_key = rotate_resp.json()["api_key"]
    assert new_key != old_key

    # Old key is rejected
    resp = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {old_key}"},
        json={"content": "Should fail with old key"},
    )
    assert resp.status_code == 401

    # New key works
    resp = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {new_key}"},
        json={"content": "Works with new key"},
    )
    assert resp.status_code == 201

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )
