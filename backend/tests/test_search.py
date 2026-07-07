import pytest

TEST_API_KEY = "mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"


@pytest.mark.asyncio
async def test_search_memory(client):

    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Python is my favourite programming language."},
    )

    response = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"query": "Which language do I use?"},
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body["results"]) > 0
