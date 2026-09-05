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


@pytest.mark.asyncio
async def test_hybrid_search_keyword_match(client):
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "The error code is ERR_404_NOT_FOUND in the API gateway."},
    )

    response = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"query": "ERR_404"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) > 0
    assert "ERR_404" in body["results"][0]["content"]


@pytest.mark.asyncio
async def test_hybrid_search_with_metadata_filter(client):
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={
            "content": "User prefers dark mode theme",
            "metadata": {"category": "preferences", "topic": "ui"},
        },
    )

    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={
            "content": "User prefers light mode theme",
            "metadata": {"category": "settings", "topic": "ui"},
        },
    )

    response = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={
            "query": "theme preferences",
            "metadata_filters": {"category": "preferences"},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) > 0
    assert body["results"][0]["metadata"].get("category") == "preferences"


@pytest.mark.asyncio
async def test_hybrid_search_recency(client):
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Today I learned about quantum computing basics."},
    )

    response = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"query": "quantum computing", "top_k": 5},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) > 0
    for result in body["results"]:
        assert 0.0 <= result["score"] <= 1.0


@pytest.mark.asyncio
async def test_search_returns_results_ranked(client):
    await client.post(
        "/api/v1/remember/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"content": "Python is a programming language"},
    )

    response = await client.post(
        "/api/v1/search/",
        headers={"Authorization": f"Bearer {TEST_API_KEY}"},
        json={"query": "Python programming language"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) > 0

    scores = [r["score"] for r in body["results"]]
    assert scores == sorted(scores, reverse=True)
