import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


@pytest.mark.asyncio
async def test_remember(client):
    response = await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "This is a test memory content."},
    )
    assert response.status_code == 201

    body = response.json()

    assert "id" in body
    assert "content" in body
    assert "external_id" in body
    assert "metadata" in body
    assert "created_at" in body
    assert "updated_at" in body
