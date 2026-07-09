import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


@pytest.mark.asyncio
async def test_empty_content(client):

    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": ""},
    )

    assert response.status_code == 400

    body = response.json()
    assert body["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_whitespace_content(client):

    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "     "},
    )

    assert response.status_code == 400

    body = response.json()
    assert body["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_empty_update(client):

    create = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Hello"},
    )

    memory_id = create.json()["memory_id"]

    response = await client.patch(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={},
    )

    assert response.status_code == 400
