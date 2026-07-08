from uuid import uuid4

import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


def _auth_headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"}


@pytest.mark.asyncio
async def test_project_lifecycle(client):
    project_name = f"SDK Project {uuid4().hex[:8]}"

    create_response = await client.post(
        "/api/v1/projects/",
        headers=_auth_headers(TEST_API_KEY),
        json={"name": project_name, "description": "Created from tests"},
    )

    assert create_response.status_code == 201
    create_body = create_response.json()
    project_id = create_body["id"]
    project_api_key = create_body["api_key"]

    list_response = await client.get(
        "/api/v1/projects/",
        headers=_auth_headers(TEST_API_KEY),
    )

    assert list_response.status_code == 200
    assert any(project["id"] == project_id for project in list_response.json())

    project_headers = _auth_headers(project_api_key)

    get_response = await client.get(f"/api/v1/projects/{project_id}", headers=project_headers)
    assert get_response.status_code == 200
    assert get_response.json()["name"] == project_name

    update_response = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers=project_headers,
        json={"name": f"{project_name} Updated", "description": "Updated description"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"].endswith("Updated")

    rotate_response = await client.post(
        f"/api/v1/projects/{project_id}/api-key/rotate",
        headers=project_headers,
    )
    assert rotate_response.status_code == 200
    rotated_body = rotate_response.json()
    rotated_api_key = rotated_body["api_key"]
    assert rotated_api_key != project_api_key

    old_key_response = await client.get(
        f"/api/v1/projects/{project_id}",
        headers=_auth_headers(project_api_key),
    )
    assert old_key_response.status_code == 401

    new_key_headers = _auth_headers(rotated_api_key)
    new_key_response = await client.get(f"/api/v1/projects/{project_id}", headers=new_key_headers)
    assert new_key_response.status_code == 200

    delete_response = await client.delete(f"/api/v1/projects/{project_id}", headers=new_key_headers)
    assert delete_response.status_code == 204

    missing_after_delete = await client.get(
        f"/api/v1/projects/{project_id}",
        headers=new_key_headers,
    )
    assert missing_after_delete.status_code == 401

    list_after_delete = await client.get(
        "/api/v1/projects/",
        headers=_auth_headers(TEST_API_KEY),
    )
    assert all(project["id"] != project_id for project in list_after_delete.json())


@pytest.mark.asyncio
async def test_project_empty_update_returns_400(client):
    create_response = await client.post(
        "/api/v1/projects/",
        headers=_auth_headers(TEST_API_KEY),
        json={"name": f"Empty Update {uuid4().hex[:8]}"},
    )
    create_body = create_response.json()
    project_id = create_body["id"]
    project_api_key = create_body["api_key"]

    response = await client.patch(
        f"/api/v1/projects/{project_id}",
        headers=_auth_headers(project_api_key),
        json={},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "empty_update"

    await client.delete(
        f"/api/v1/projects/{project_id}",
        headers=_auth_headers(project_api_key),
    )
