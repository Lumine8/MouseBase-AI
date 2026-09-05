import json
import time
import uuid

import pytest


@pytest.mark.asyncio
async def test_export_json_format(client):
    """Export memories in JSON format."""
    ts = int(time.time())
    email = f"export_json_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Export JSON {_uid()}"},
    )
    project_id = proj.json()["id"]
    api_key = proj.json()["api_key"]

    # Create memories
    mem1 = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "Export test memory 1"},
    )
    mem2 = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "Export test memory 2"},
    )
    memory_ids = [mem1.json()["id"], mem2.json()["id"]]

    # Export as JSON
    resp = await client.post(
        f"/api/v1/explorer/export?project_id={project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"memory_ids": memory_ids, "format": "json"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["format"] == "json"
    assert data["count"] == 2
    assert len(data["memories"]) == 2

    # Verify content is present
    contents = [m.get("content", "") for m in data["memories"]]
    assert "Export test memory 1" in contents
    assert "Export test memory 2" in contents

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_export_csv_format(client):
    """Export memories in CSV format."""
    ts = int(time.time())
    email = f"export_csv_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Export CSV {_uid()}"},
    )
    project_id = proj.json()["id"]
    api_key = proj.json()["api_key"]

    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "CSV export test"},
    )
    memory_ids = [mem.json()["id"]]

    resp = await client.post(
        f"/api/v1/explorer/export?project_id={project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"memory_ids": memory_ids, "format": "csv"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["format"] == "csv"
    assert data["count"] == 1

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_export_ndjson_format(client):
    """Export memories in NDJSON format."""
    ts = int(time.time())
    email = f"export_ndjson_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Export NDJSON {_uid()}"},
    )
    project_id = proj.json()["id"]
    api_key = proj.json()["api_key"]

    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "NDJSON export test"},
    )
    memory_ids = [mem.json()["id"]]

    resp = await client.post(
        f"/api/v1/explorer/export?project_id={project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"memory_ids": memory_ids, "format": "ndjson"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["format"] == "ndjson"
    assert data["count"] == 1

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_export_empty_list_rejected(client):
    """Export with empty memory_ids list should fail."""
    ts = int(time.time())
    email = f"export_empty_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Export Empty {_uid()}"},
    )
    project_id = proj.json()["id"]

    resp = await client.post(
        f"/api/v1/explorer/export?project_id={project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"memory_ids": [], "format": "json"},
    )
    assert resp.status_code == 422

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_export_invalid_format_rejected(client):
    """Export with invalid format should fail."""
    ts = int(time.time())
    email = f"export_bad_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": pw},
    )
    jwt = resp.json()["token"]

    proj = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"name": f"Export Bad {_uid()}"},
    )
    project_id = proj.json()["id"]
    api_key = proj.json()["api_key"]

    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"content": "Format test"},
    )
    memory_ids = [mem.json()["id"]]

    resp = await client.post(
        f"/api/v1/explorer/export?project_id={project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
        json={"memory_ids": memory_ids, "format": "xml"},
    )
    assert resp.status_code == 422

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {jwt}"},
    )


@pytest.mark.asyncio
async def test_export_cross_project_denied(client):
    """Cannot export memories from another user's project."""
    ts = int(time.time())
    email_a = f"export_a_{ts}@test.mousebase.dev"
    email_b = f"export_b_{ts}@test.mousebase.dev"
    pw = "TestPassword123!"

    resp_a = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_a, "password": pw},
    )
    jwt_a = resp_a.json()["token"]

    resp_b = await client.post(
        "/api/v1/auth/signup",
        json={"email": email_b, "password": pw},
    )
    jwt_b = resp_b.json()["token"]

    proj_a = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt_a}"},
        json={"name": f"Export Owner {_uid()}"},
    )
    api_key_a = proj_a.json()["api_key"]

    proj_b = await client.post(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {jwt_b}"},
        json={"name": f"Export Attacker {_uid()}"},
    )

    # Create memory in project A
    mem = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {api_key_a}"},
        json={"content": "Secret memory"},
    )
    memory_id = mem.json()["id"]

    # User B tries to export User A's memory using B's project
    resp = await client.post(
        f"/api/v1/explorer/export?project_id={proj_b.json()['id']}",
        headers={"Authorization": f"Bearer {jwt_b}"},
        json={"memory_ids": [memory_id], "format": "json"},
    )
    # Should either 404 (memory not found in B's project) or 403
    assert resp.status_code in (404, 403)

    # Cleanup
    await client.delete(
        f"/api/v1/projects/{proj_a.json()['id']}",
        headers={"Authorization": f"Bearer {jwt_a}"},
    )
    await client.delete(
        f"/api/v1/projects/{proj_b.json()['id']}",
        headers={"Authorization": f"Bearer {jwt_b}"},
    )


def _uid():
    return uuid.uuid4().hex[:8]
