import time
import uuid

import pytest


@pytest.mark.asyncio
async def test_deleted_memory_not_returned_by_get(client):
    """After deletion, get by ID returns 404."""
    ts = int(time.time())
    email = f"delget_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Del Test {_uid()}"},
    )
    api_key = proj.json()["api_key"]

    # Create memory
    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "This memory will be deleted"},
    )
    memory_id = mem.json()["id"]

    # Verify it exists
    resp = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 200

    # Delete it
    resp = await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 204

    # Get returns 404
    resp = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 404

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj.json()['id']}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_deleted_memory_not_returned_by_search(client):
    """After deletion, search does not return the memory."""
    ts = int(time.time())
    email = f"delsearch_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Del Search {_uid()}"},
    )
    api_key = proj.json()["api_key"]

    # Create a unique memory
    unique_phrase = f"quantum entanglement {uuid.uuid4().hex[:8]}"
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": f"Memory about {unique_phrase}"},
    )

    # Search should find it
    resp = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"query": unique_phrase, "top_k": 10},
    )
    assert resp.status_code == 200
    results = resp.json().get("results", [])
    found_ids = [r["id"] for r in results]

    # Delete all matching memories
    for mid in found_ids:
        await client.delete(
            f"/api/v1/memory/{mid}",
            headers={"Authorization": f"Bearer {api_key}"},
        )

    # Search should return nothing
    resp = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"query": unique_phrase, "top_k": 10},
    )
    assert resp.status_code == 200
    results = resp.json().get("results", [])
    for r in results:
        assert r["id"] not in found_ids

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj.json()['id']}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_double_delete_returns_404(client):
    """Deleting the same memory twice should return 404 on the second call."""
    ts = int(time.time())
    email = f"del2_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Del Double {_uid()}"},
    )
    api_key = proj.json()["api_key"]

    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "Double delete me"},
    )
    memory_id = mem.json()["id"]

    # First delete succeeds
    resp = await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 204

    # Second delete returns 404
    resp = await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 404

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj.json()['id']}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_delete_nonexistent_memory_returns_404(client):
    """Deleting a memory that never existed returns 404."""
    ts = int(time.time())
    email = f"delnone_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Del None {_uid()}"},
    )
    api_key = proj.json()["api_key"]

    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"/api/v1/memory/{fake_id}",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 404

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj.json()['id']}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


def _uid():
    return uuid.uuid4().hex[:8]
