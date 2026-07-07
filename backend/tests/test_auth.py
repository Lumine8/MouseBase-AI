import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


@pytest.mark.asyncio
async def test_missing_api_key(client):
    response = await client.post(
        "/api/v1/remember/",
        json={"content": "Hello"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_api_key(client):
    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": "Bearer invalid_key"},
        json={"content": "Hello"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_malformed_api_key(client):
    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": "Bearer hello"},
        json={"content": "Hello"},
    )

    assert response.status_code == 401
