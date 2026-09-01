import os
import pytest

TEST_API_KEY = os.environ.get(
    "TEST_API_KEY", "mb_test_ci_placeholder_key_for_local_dev_only"
)


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
