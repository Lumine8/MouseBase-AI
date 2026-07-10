import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


@pytest.mark.asyncio
async def test_get_memory(client):

    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Retrieve me"},
    )

    memory_id = response.json()["id"]

    response = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
    )

    assert response.status_code == 200
    assert response.json()["content"] == "Retrieve me"


@pytest.mark.asyncio
async def test_update_memory(client):

    create = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Old content"},
    )

    memory_id = create.json()["id"]

    response = await client.patch(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "New content"},
    )

    assert response.status_code == 200
    assert response.json()["content"] == "New content"


@pytest.mark.asyncio
async def test_delete_memory(client):

    create = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Delete me"},
    )

    memory_id = create.json()["id"]

    response = await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_deleted_memory_not_found(client):

    create = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Delete me"},
    )

    memory_id = create.json()["id"]

    await client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
    )

    response = await client.get(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
    )

    assert response.status_code == 404
