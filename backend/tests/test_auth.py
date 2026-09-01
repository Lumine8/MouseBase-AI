import os
import pytest

TEST_API_KEY = os.environ.get(
    "TEST_API_KEY", "mb_test_ci_placeholder_key_for_local_dev_only"
)


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
