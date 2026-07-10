from datetime import datetime, timezone
import httpx
import pytest
import respx

from mousebase import (
    AsyncMouseBase,
    AuthenticationError,
    EmbeddingProviderError,
    InternalError,
    MissingAPIKeyError,
    MouseBase,
    MouseBaseError,
    RateLimitError,
    ValidationError,
)

BASE_URL = "https://api.mousebase.dev/api/v1"
API_KEY = "mb_live_test_key_abc123"


@pytest.fixture
def client():
    return MouseBase(api_key=API_KEY, base_url=BASE_URL, timeout=5)


@pytest.fixture
def async_client():
    return AsyncMouseBase(api_key=API_KEY, base_url=BASE_URL, timeout=5)


# ─── remember ────────────────────────────────────────────────────────────────


@respx.mock
def test_remember_success(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/").respond(
        201,
        json={
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "external_id": None,
            "content": "Hello world",
            "metadata": {},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:00Z",
        },
    )
    result = client.remember(content="Hello world")
    assert route.called
    assert result.id == "550e8400-e29b-41d4-a716-446655440000"
    assert result.content == "Hello world"
    assert result.created_at == datetime(2026, 7, 9, 12, 0, 0, tzinfo=timezone.utc)


@respx.mock
def test_remember_with_metadata(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/").respond(
        201,
        json={
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "external_id": "ext_1",
            "content": "Hello",
            "metadata": {"source": "test"},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:00Z",
        },
    )
    client.remember(content="Hello", external_id="ext_1", metadata={"source": "test"})
    assert route.called
    sent = route.calls[0].request.content
    assert b"ext_1" in sent
    assert b"test" in sent


# ─── error mapping ────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("status", "error_code", "expected_exc"),
    [
        (400, "validation_error", ValidationError),
        (401, "invalid_api_key", AuthenticationError),
        (429, "rate_limited", RateLimitError),
        (500, "internal_error", InternalError),
        (502, "internal_error", InternalError),
        (503, "embedding_provider_unavailable", EmbeddingProviderError),
    ],
)
@respx.mock
def test_error_codes(client: MouseBase, status, error_code, expected_exc):
    respx.post(f"{BASE_URL}/remember/").respond(
        status,
        json={"error": {"code": error_code, "message": "Something went wrong"}},
    )
    with pytest.raises(expected_exc) as exc_info:
        client.remember(content="x")
    assert exc_info.value.code == error_code
    assert exc_info.value.status_code == status


# ─── retries ──────────────────────────────────────────────────────────────────


@respx.mock
def test_retry_on_429_then_succeeds(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/")
    route.side_effect = [
        httpx.Response(429, json={"error": {"code": "rate_limited", "message": "Back off"}}),
        httpx.Response(429, json={"error": {"code": "rate_limited", "message": "Back off"}}),
        httpx.Response(
            201,
            json={
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "external_id": None,
                "content": "x",
                "metadata": {},
                "created_at": "2026-07-09T12:00:00Z",
                "updated_at": "2026-07-09T12:00:00Z",
            },
        ),
    ]
    result = client.remember(content="x")
    assert result.id == "550e8400-e29b-41d4-a716-446655440000"
    assert route.call_count == 3


@respx.mock
def test_no_retry_on_400(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/").respond(
        400, json={"error": {"code": "validation_error", "message": "Bad request"}}
    )
    with pytest.raises(ValidationError):
        client.remember(content="x")
    assert route.call_count == 1


@respx.mock
def test_no_retry_on_401(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/").respond(
        401, json={"error": {"code": "invalid_api_key", "message": "Invalid key"}}
    )
    with pytest.raises(AuthenticationError):
        client.remember(content="x")
    assert route.call_count == 1


# ─── network errors ──────────────────────────────────────────────────────────


@respx.mock
def test_retry_on_network_error(client: MouseBase):
    route = respx.post(f"{BASE_URL}/remember/")
    route.side_effect = [
        httpx.NetworkError("connection refused"),
        httpx.Response(
            201,
            json={
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "external_id": None,
                "content": "x",
                "metadata": {},
                "created_at": "2026-07-09T12:00:00Z",
                "updated_at": "2026-07-09T12:00:00Z",
            },
        ),
    ]
    result = client.remember(content="x")
    assert result.id == "550e8400-e29b-41d4-a716-446655440000"
    assert route.call_count == 2


# ─── missing API key ──────────────────────────────────────────────────────────


def test_missing_api_key():
    with pytest.raises(MissingAPIKeyError):
        MouseBase()


def test_missing_api_key_async():
    with pytest.raises(MissingAPIKeyError):
        AsyncMouseBase()


@respx.mock
def test_api_key_from_env():
    import os
    os.environ["MOUSEBASE_API_KEY"] = "from_env_key"
    c = MouseBase(base_url=BASE_URL, timeout=5)
    route = respx.post(f"{BASE_URL}/remember/").respond(
        201,
        json={
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "external_id": None,
            "content": "x",
            "metadata": {},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:00Z",
        },
    )
    c.remember(content="x")
    assert route.called


# ─── timeout ──────────────────────────────────────────────────────────────────


@respx.mock
def test_timeout_raises_clear_error(client: MouseBase):
    respx.post(f"{BASE_URL}/remember/").mock(side_effect=httpx.TimeoutException("timed out"))
    with pytest.raises(MouseBaseError, match="timed out"):
        client.remember(content="x")


# ─── context manager ──────────────────────────────────────────────────────────


@respx.mock
def test_context_manager_closes_client():
    with MouseBase(api_key=API_KEY, base_url=BASE_URL, timeout=5) as c:
        respx.post(f"{BASE_URL}/remember/").respond(
            201,
            json={
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "external_id": None,
                "content": "x",
                "metadata": {},
                "created_at": "2026-07-09T12:00:00Z",
                "updated_at": "2026-07-09T12:00:00Z",
            },
        )
        result = c.remember(content="x")
        assert result.id is not None
    assert c._client.is_closed


# ─── search ───────────────────────────────────────────────────────────────────


@respx.mock
def test_search(client: MouseBase):
    respx.post(f"{BASE_URL}/search/").respond(
        200,
        json={
            "results": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "external_id": None,
                    "content": "Hello world",
                    "metadata": {},
                    "score": 0.95,
                }
            ]
        },
    )
    result = client.search(query="hello", top_k=5)
    assert len(result.results) == 1
    assert result.results[0].score == 0.95
    assert result.results[0].content == "Hello world"


# ─── get / update / delete ────────────────────────────────────────────────────


@respx.mock
def test_get_memory(client: MouseBase):
    respx.get(f"{BASE_URL}/memory/abc-123").respond(
        200,
        json={
            "id": "abc-123",
            "external_id": None,
            "content": "test memory",
            "metadata": {},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:00Z",
        },
    )
    result = client.get("abc-123")
    assert result.id == "abc-123"
    assert result.content == "test memory"


@respx.mock
def test_update_memory(client: MouseBase):
    respx.patch(f"{BASE_URL}/memory/abc-123").respond(
        200,
        json={
            "id": "abc-123",
            "external_id": None,
            "content": "updated",
            "metadata": {"key": "val"},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:01Z",
        },
    )
    result = client.update("abc-123", content="updated", metadata={"key": "val"})
    assert result.content == "updated"
    assert result.metadata == {"key": "val"}


@respx.mock
def test_delete_memory(client: MouseBase):
    route = respx.delete(f"{BASE_URL}/memory/abc-123").respond(204)
    result = client.delete("abc-123")
    assert result is None
    assert route.called


# ─── async client ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
@respx.mock
async def test_async_remember(async_client: AsyncMouseBase):
    route = respx.post(f"{BASE_URL}/remember/").respond(
        201,
        json={
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "external_id": None,
            "content": "Hello",
            "metadata": {},
            "created_at": "2026-07-09T12:00:00Z",
            "updated_at": "2026-07-09T12:00:00Z",
        },
    )
    result = await async_client.remember(content="Hello")
    assert route.called
    assert result.id == "550e8400-e29b-41d4-a716-446655440000"


@pytest.mark.asyncio
@respx.mock
async def test_async_context_manager():
    async with AsyncMouseBase(api_key=API_KEY, base_url=BASE_URL, timeout=5) as c:
        respx.post(f"{BASE_URL}/remember/").respond(
            201,
            json={
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "external_id": None,
                "content": "x",
                "metadata": {},
                "created_at": "2026-07-09T12:00:00Z",
                "updated_at": "2026-07-09T12:00:00Z",
            },
        )
        result = await c.remember(content="x")
        assert result.id is not None
    assert c._client.is_closed
