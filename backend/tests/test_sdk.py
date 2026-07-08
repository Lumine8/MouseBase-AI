from platform import python_version
from typing import Callable
from uuid import UUID

import httpx
import pytest
import pytest_asyncio

from mousebase import AsyncMouseBase, MouseBase, __version__
from mousebase.errors import AuthenticationError, MemoryNotFoundError, ProjectNotFoundError, ValidationError

TEST_API_KEY = "mb_live_test"
TEST_MEMORY_ID = "11111111-1111-1111-1111-111111111111"
EXPECTED_USER_AGENT = f"mousebase-python/{__version__} python/{python_version()}"


def _response_handler(captured: dict[str, str]) -> Callable[[httpx.Request], httpx.Response]:
    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["authorization"] = request.headers.get("authorization", "")
        captured["user_agent"] = request.headers.get("user-agent", "")

        if request.url.path.endswith("/remember/"):
            return httpx.Response(
                201,
                json={
                    "memory_id": TEST_MEMORY_ID,
                    "created_at": "2026-07-07T00:00:00Z",
                },
            )

        if request.url.path.endswith("/search/"):
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "memory_id": TEST_MEMORY_ID,
                            "external_id": None,
                            "content": "Python is my favourite programming language.",
                            "metadata": {},
                            "score": 0.99,
                        }
                    ]
                },
            )

        if request.url.path.endswith("/projects/") and request.method == "POST":
            return httpx.Response(
                201,
                json={
                    "id": TEST_MEMORY_ID,
                    "owner_id": TEST_MEMORY_ID,
                    "name": "Test Project",
                    "description": "Test project description",
                    "api_key_id": "test_key_id",
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:00Z",
                    "api_key": "mb_live_test_project_key",
                },
            )

        if request.url.path.endswith("/projects/") and request.method == "GET":
            return httpx.Response(
                200,
                json=[
                    {
                        "id": TEST_MEMORY_ID,
                        "owner_id": TEST_MEMORY_ID,
                        "name": "Test Project",
                        "description": "Test project description",
                        "api_key_id": "test_key_id",
                        "created_at": "2026-07-07T00:00:00Z",
                        "updated_at": "2026-07-07T00:00:00Z",
                    }
                ],
            )

        if "/projects/" in request.url.path and request.method == "GET":
            return httpx.Response(
                200,
                json={
                    "id": TEST_MEMORY_ID,
                    "owner_id": TEST_MEMORY_ID,
                    "name": "Test Project",
                    "description": "Test project description",
                    "api_key_id": "test_key_id",
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:00Z",
                },
            )

        if "/projects/" in request.url.path and request.method == "PATCH":
            return httpx.Response(
                200,
                json={
                    "id": TEST_MEMORY_ID,
                    "owner_id": TEST_MEMORY_ID,
                    "name": "Updated Project",
                    "description": "Updated project description",
                    "api_key_id": "test_key_id",
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:01Z",
                },
            )

        if request.url.path.endswith("/api-key/rotate"):
            return httpx.Response(
                200,
                json={
                    "id": TEST_MEMORY_ID,
                    "owner_id": TEST_MEMORY_ID,
                    "name": "Updated Project",
                    "description": "Updated project description",
                    "api_key_id": "rotated_key_id",
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:01Z",
                    "api_key": "mb_live_rotated_project_key",
                },
            )

        if "/projects/" in request.url.path and request.method == "DELETE":
            return httpx.Response(204)

        if request.method == "GET":
            return httpx.Response(
                200,
                json={
                    "memory_id": TEST_MEMORY_ID,
                    "external_id": None,
                    "content": "Python is my favourite programming language.",
                    "metadata": {},
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:00Z",
                },
            )

        if request.method == "PATCH":
            return httpx.Response(
                200,
                json={
                    "memory_id": TEST_MEMORY_ID,
                    "external_id": None,
                    "content": "Updated content",
                    "metadata": {},
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:01Z",
                },
            )

        if request.method == "DELETE":
            return httpx.Response(204)

        return httpx.Response(404, json={"error": {"code": "not_found", "message": "Not found"}})

    return handler


@pytest.fixture
def sdk_client() -> MouseBase:
    captured: dict[str, str] = {}
    client = httpx.Client(transport=httpx.MockTransport(_response_handler(captured)), base_url="http://test")
    sdk = MouseBase(api_key=TEST_API_KEY, base_url="http://test", client=client)
    sdk._captured = captured  # type: ignore[attr-defined]

    yield sdk

    client.close()


@pytest_asyncio.fixture
async def async_sdk_client() -> AsyncMouseBase:
    captured: dict[str, str] = {}
    client = httpx.AsyncClient(
        transport=httpx.MockTransport(_response_handler(captured)),
        base_url="http://test",
    )
    sdk = AsyncMouseBase(api_key=TEST_API_KEY, base_url="http://test", client=client)
    sdk._captured = captured  # type: ignore[attr-defined]

    yield sdk

    await client.aclose()


def test_version_and_defaults() -> None:
    with MouseBase(api_key=TEST_API_KEY) as sdk:
        assert __version__ == "0.1.0"
        assert sdk.base_url == "https://api.mousebase.ai"
        assert sdk.user_agent == EXPECTED_USER_AGENT
        assert sdk.timeout.connect == 5
        assert sdk.timeout.read == 30
        assert sdk.timeout.write == 30
        assert sdk.timeout.pool == 5


def test_remember_round_trip(sdk_client: MouseBase) -> None:
    response = sdk_client.remember("Hello MouseBase")

    assert response.memory_id == UUID(TEST_MEMORY_ID)
    assert sdk_client._captured["method"] == "POST"  # type: ignore[attr-defined]
    assert sdk_client._captured["path"] == "/api/v1/remember/"  # type: ignore[attr-defined]
    assert sdk_client._captured["authorization"] == f"Bearer {TEST_API_KEY}"  # type: ignore[attr-defined]
    assert sdk_client._captured["user_agent"] == EXPECTED_USER_AGENT  # type: ignore[attr-defined]


def test_search_round_trip(sdk_client: MouseBase) -> None:
    response = sdk_client.search("favorite language")

    assert len(response.results) == 1
    assert response.results[0].content.startswith("Python")


def test_get_update_delete_round_trip(sdk_client: MouseBase) -> None:
    memory_id = UUID(TEST_MEMORY_ID)

    retrieved = sdk_client.get_memory(memory_id)
    updated = sdk_client.update_memory(memory_id, content="Updated content")

    assert retrieved.memory_id == memory_id
    assert updated.content == "Updated content"
    assert sdk_client.delete_memory(memory_id) is True


def test_projects_round_trip(sdk_client: MouseBase) -> None:
    created = sdk_client.create_project("Test Project", description="Test project description")
    listed = sdk_client.list_projects()
    retrieved = sdk_client.get_project(created.id)
    updated = sdk_client.update_project(created.id, name="Updated Project")
    rotated = sdk_client.rotate_project_key(created.id)

    assert created.api_key == "mb_live_test_project_key"
    assert len(listed) == 1
    assert retrieved.id == created.id
    assert updated.name == "Updated Project"
    assert rotated.api_key == "mb_live_rotated_project_key"

    assert sdk_client.delete_project(created.id) is True


def test_list_memories_not_implemented(sdk_client: MouseBase) -> None:
    with pytest.raises(NotImplementedError):
        sdk_client.list_memories()

    with pytest.raises(AttributeError):
        sdk_client.list()


@pytest.mark.asyncio
async def test_async_round_trip(async_sdk_client: AsyncMouseBase) -> None:
    created = await async_sdk_client.remember("Hello MouseBase")
    results = await async_sdk_client.search("favorite language")
    retrieved = await async_sdk_client.get_memory(created.memory_id)
    updated = await async_sdk_client.update_memory(created.memory_id, content="Updated content")

    assert created.memory_id == UUID(TEST_MEMORY_ID)
    assert len(results.results) == 1
    assert retrieved.memory_id == created.memory_id
    assert updated.content == "Updated content"
    assert await async_sdk_client.delete_memory(created.memory_id) is True


@pytest.mark.asyncio
async def test_async_projects_round_trip(async_sdk_client: AsyncMouseBase) -> None:
    created = await async_sdk_client.create_project("Test Project", description="Test project description")
    listed = await async_sdk_client.list_projects()
    retrieved = await async_sdk_client.get_project(created.id)
    updated = await async_sdk_client.update_project(created.id, name="Updated Project")
    rotated = await async_sdk_client.rotate_project_key(created.id)

    assert created.api_key == "mb_live_test_project_key"
    assert len(listed) == 1
    assert retrieved.id == created.id
    assert updated.name == "Updated Project"
    assert rotated.api_key == "mb_live_rotated_project_key"

    assert await async_sdk_client.delete_project(created.id) is True


def test_rotate_key_invalidates_old_key() -> None:
    old_key = "mb_live_original_key"
    new_key = "mb_live_rotated_key"
    state: dict[str, str] = {"valid_key": old_key}

    def handler(request: httpx.Request) -> httpx.Response:
        auth = request.headers.get("authorization", "")
        token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""

        if request.url.path.endswith("/api-key/rotate"):
            if token != state["valid_key"]:
                return httpx.Response(
                    401, json={"error": {"code": "invalid_api_key", "message": "Invalid API key"}}
                )
            state["valid_key"] = new_key
            return httpx.Response(
                200,
                json={
                    "id": TEST_MEMORY_ID,
                    "owner_id": TEST_MEMORY_ID,
                    "name": "Test Project",
                    "description": "Test project description",
                    "api_key_id": "new_key_id",
                    "created_at": "2026-07-07T00:00:00Z",
                    "updated_at": "2026-07-07T00:00:01Z",
                    "api_key": new_key,
                },
            )

        if token != state["valid_key"]:
            return httpx.Response(
                401, json={"error": {"code": "invalid_api_key", "message": "Invalid API key"}}
            )

        return httpx.Response(
            200,
            json={
                "memory_id": TEST_MEMORY_ID,
                "external_id": None,
                "content": "Python is my favourite programming language.",
                "metadata": {},
                "created_at": "2026-07-07T00:00:00Z",
                "updated_at": "2026-07-07T00:00:00Z",
            },
        )

    old_transport = httpx.MockTransport(handler)
    old_client = httpx.Client(transport=old_transport, base_url="http://test")
    sdk_old = MouseBase(api_key=old_key, base_url="http://test", client=old_client)

    new_transport = httpx.MockTransport(handler)
    new_client = httpx.Client(transport=new_transport, base_url="http://test")
    sdk_new = MouseBase(api_key=new_key, base_url="http://test", client=new_client)

    result = sdk_old.rotate_project_key(TEST_MEMORY_ID)
    assert result.api_key == new_key

    with pytest.raises(AuthenticationError):
        sdk_old.get_memory(TEST_MEMORY_ID)

    memory = sdk_new.get_memory(TEST_MEMORY_ID)
    assert memory.memory_id == UUID(TEST_MEMORY_ID)

    old_client.close()
    new_client.close()


def test_projects_sub_resource(sdk_client: MouseBase) -> None:
    result = sdk_client.projects.create("Sub Project", description="via sub-resource")
    assert result.api_key == "mb_live_test_project_key"

    items = sdk_client.projects.list()
    assert len(items) == 1

    retrieved = sdk_client.projects.get(result.id)
    assert retrieved.name == "Test Project"

    updated = sdk_client.projects.update(result.id, name="Updated Name")
    assert updated.name == "Updated Project"

    rotated = sdk_client.projects.rotate_key(result.id)
    assert rotated.api_key == "mb_live_rotated_project_key"

    assert sdk_client.projects.delete(result.id) is True


@pytest.mark.asyncio
async def test_async_defaults() -> None:
    async with AsyncMouseBase(api_key=TEST_API_KEY) as sdk:
        assert sdk.base_url == "https://api.mousebase.ai"
        assert sdk.user_agent == EXPECTED_USER_AGENT


def test_sync_retry_backoff(monkeypatch: pytest.MonkeyPatch) -> None:
    attempts: list[int] = []
    sleeps: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        attempts.append(len(attempts))
        if len(attempts) < 3:
            return httpx.Response(503, json={"error": {"code": "x", "message": "retry"}})
        return httpx.Response(
            201,
            json={
                "memory_id": TEST_MEMORY_ID,
                "created_at": "2026-07-07T00:00:00Z",
            },
        )

    monkeypatch.setattr("mousebase.client.time.sleep", lambda seconds: sleeps.append(seconds))

    client = MouseBase(
        api_key=TEST_API_KEY,
        base_url="http://test",
        client=httpx.Client(transport=httpx.MockTransport(handler), base_url="http://test"),
    )

    response = client.remember("Hello MouseBase")

    assert response.memory_id == UUID(TEST_MEMORY_ID)
    assert attempts == [0, 1, 2]
    assert sleeps == [1, 2]


@pytest.mark.asyncio
async def test_async_retry_backoff(monkeypatch: pytest.MonkeyPatch) -> None:
    attempts: list[int] = []
    sleeps: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        attempts.append(len(attempts))
        if len(attempts) < 3:
            return httpx.Response(503, json={"error": {"code": "x", "message": "retry"}})
        return httpx.Response(
            201,
            json={
                "memory_id": TEST_MEMORY_ID,
                "created_at": "2026-07-07T00:00:00Z",
            },
        )

    async def fake_sleep(seconds: float) -> None:
        sleeps.append(seconds)

    monkeypatch.setattr("mousebase.client.asyncio.sleep", fake_sleep)

    async_client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://test")
    client = AsyncMouseBase(api_key=TEST_API_KEY, base_url="http://test", client=async_client)

    response = await client.remember("Hello MouseBase")

    await async_client.aclose()

    assert response.memory_id == UUID(TEST_MEMORY_ID)
    assert attempts == [0, 1, 2]
    assert sleeps == [1, 2]


@pytest.mark.parametrize(
    "status_code,code,exc_type",
    [
        (401, "x", AuthenticationError),
        (404, "memory_not_found", MemoryNotFoundError),
        (404, "project_not_found", ProjectNotFoundError),
        (400, "x", ValidationError),
    ],
)
def test_error_translation(status_code: int, code: str, exc_type: type[Exception]) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json={"error": {"code": code, "message": "nope"}})

    client = MouseBase(
        api_key=TEST_API_KEY,
        base_url="http://test",
        client=httpx.Client(transport=httpx.MockTransport(handler), base_url="http://test"),
    )

    with pytest.raises(exc_type):
        client.get_memory(UUID(TEST_MEMORY_ID))
