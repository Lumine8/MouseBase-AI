from __future__ import annotations

import asyncio
import platform
import time
from typing import Any
from uuid import UUID

import httpx

from mousebase.errors import (
    APIError,
    AuthenticationError,
    MemoryNotFoundError,
    ProjectNotFoundError,
    RateLimitError,
    ServiceUnavailableError,
    ValidationError,
)
from mousebase.models import (
    ProjectCreateRequest,
    ProjectKeyResponse,
    ProjectResponse,
    ProjectUpdateRequest,
    MemoryResponse,
    RememberRequest,
    RememberResponse,
    SearchRequest,
    SearchResponse,
    UpdateMemoryRequest,
)
from mousebase.version import __version__

DEFAULT_BASE_URL = "https://api.mousebase.ai"
DEFAULT_TIMEOUT = None
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}
MAX_ATTEMPTS = 3


class _BaseMouseBase:
    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: httpx.Timeout | float | None = DEFAULT_TIMEOUT,
        user_agent: str | None = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("api_key is required")

        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.timeout = self._normalize_timeout(timeout)
        self.user_agent = user_agent or (
            f"mousebase-python/{__version__} python/{platform.python_version()}"
        )

    @staticmethod
    def _normalize_timeout(timeout: httpx.Timeout | float | None) -> httpx.Timeout:
        if timeout is None:
            return httpx.Timeout(connect=5, read=30, write=30, pool=5)
        if isinstance(timeout, httpx.Timeout):
            return timeout
        return httpx.Timeout(timeout)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }

    @staticmethod
    def _coerce_uuid(memory_id: str | UUID) -> str:
        return str(memory_id)

    @staticmethod
    def _safe_json(response: httpx.Response) -> dict[str, Any]:
        try:
            data = response.json()
        except ValueError:
            return {}
        return data if isinstance(data, dict) else {}

    def _raise_for_response(self, response: httpx.Response) -> None:
        payload = self._safe_json(response)
        error = payload.get("error", {}) if isinstance(payload, dict) else {}
        code = str(error.get("code") or "internal_error")
        message = str(error.get("message") or response.text or "Request failed")
        status_code = response.status_code

        if status_code in (401, 403):
            raise AuthenticationError(message=message, status_code=status_code, code=code)
        if status_code == 404:
            if code == "project_not_found":
                raise ProjectNotFoundError(message=message, status_code=status_code, code=code)
            raise MemoryNotFoundError(message=message, status_code=status_code, code=code)
        if status_code == 400:
            raise ValidationError(message=message, status_code=status_code, code=code)
        if status_code == 429:
            raise RateLimitError(message=message, status_code=status_code, code=code)
        if status_code in {408, 500, 502, 503, 504}:
            raise ServiceUnavailableError(message=message, status_code=status_code, code=code)

        raise APIError(message=message, status_code=status_code, code=code)

    def _prepare_response(self, response: httpx.Response) -> Any:
        if response.status_code >= 400:
            self._raise_for_response(response)

        if response.status_code == 204:
            return None

        return response.json()

    def _build_memory_response(self, data: Any) -> MemoryResponse:
        return MemoryResponse.model_validate(data)

    def _build_remember_response(self, data: Any) -> RememberResponse:
        return RememberResponse.model_validate(data)

    def _build_search_response(self, data: Any) -> SearchResponse:
        return SearchResponse.model_validate(data)

    def _build_project_response(self, data: Any) -> ProjectResponse:
        return ProjectResponse.model_validate(data)

    def _build_project_key_response(self, data: Any) -> ProjectKeyResponse:
        return ProjectKeyResponse.model_validate(data)


class ProjectsResource:
    def __init__(self, client: MouseBase):
        self._client = client

    def create(
        self,
        name: str,
        description: str | None = None,
    ) -> ProjectKeyResponse:
        return self._client.create_project(name, description)

    def list(self) -> list[ProjectResponse]:
        return self._client.list_projects()

    def get(self, project_id: str | UUID) -> ProjectResponse:
        return self._client.get_project(project_id)

    def update(
        self,
        project_id: str | UUID,
        name: str | None = None,
        description: str | None = None,
    ) -> ProjectResponse:
        return self._client.update_project(project_id, name=name, description=description)

    def delete(self, project_id: str | UUID) -> bool:
        return self._client.delete_project(project_id)

    def rotate_key(self, project_id: str | UUID) -> ProjectKeyResponse:
        return self._client.rotate_project_key(project_id)


class AsyncProjectsResource:
    def __init__(self, client: AsyncMouseBase):
        self._client = client

    async def create(
        self,
        name: str,
        description: str | None = None,
    ) -> ProjectKeyResponse:
        return await self._client.create_project(name, description)

    async def list(self) -> list[ProjectResponse]:
        return await self._client.list_projects()

    async def get(self, project_id: str | UUID) -> ProjectResponse:
        return await self._client.get_project(project_id)

    async def update(
        self,
        project_id: str | UUID,
        name: str | None = None,
        description: str | None = None,
    ) -> ProjectResponse:
        return await self._client.update_project(project_id, name=name, description=description)

    async def delete(self, project_id: str | UUID) -> bool:
        return await self._client.delete_project(project_id)

    async def rotate_key(self, project_id: str | UUID) -> ProjectKeyResponse:
        return await self._client.rotate_project_key(project_id)


class MouseBase(_BaseMouseBase):
    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: httpx.Timeout | float | None = DEFAULT_TIMEOUT,
        client: httpx.Client | None = None,
        user_agent: str | None = None,
    ) -> None:
        super().__init__(api_key=api_key, base_url=base_url, timeout=timeout, user_agent=user_agent)
        self._client = client or httpx.Client(base_url=self.base_url, timeout=self.timeout)
        self._owns_client = client is None
        self.projects = ProjectsResource(self)

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> MouseBase:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    def remember(
        self,
        content: str,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> RememberResponse:
        payload = RememberRequest(content=content, external_id=external_id, metadata=metadata or {})
        data = self._send_request(
            "POST",
            f"{API_PREFIX}/remember/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_remember_response(data)

    def search(self, query: str, top_k: int = 10) -> SearchResponse:
        payload = SearchRequest(query=query, top_k=top_k)
        data = self._send_request(
            "POST",
            f"{API_PREFIX}/search/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_search_response(data)

    def get_memory(self, memory_id: str | UUID) -> MemoryResponse:
        data = self._send_request("GET", f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}")
        return self._build_memory_response(data)

    def update_memory(
        self,
        memory_id: str | UUID,
        content: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryResponse:
        payload = UpdateMemoryRequest(content=content, external_id=external_id, metadata=metadata)
        data = self._send_request(
            "PATCH",
            f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}",
            json=payload.model_dump(mode="json", exclude_none=True),
        )
        return self._build_memory_response(data)

    def delete_memory(self, memory_id: str | UUID) -> bool:
        self._send_request("DELETE", f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}")
        return True

    def list_memories(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("The backend does not expose a list memories endpoint yet.")

    def get(self, memory_id: str | UUID) -> MemoryResponse:
        return self.get_memory(memory_id)

    def update(
        self,
        memory_id: str | UUID,
        content: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryResponse:
        return self.update_memory(
            memory_id,
            content=content,
            external_id=external_id,
            metadata=metadata,
        )

    def delete(self, memory_id: str | UUID) -> bool:
        return self.delete_memory(memory_id)

    def create_project(
        self,
        name: str,
        description: str | None = None,
    ) -> ProjectKeyResponse:
        payload = ProjectCreateRequest(name=name, description=description)
        data = self._send_request(
            "POST",
            f"{API_PREFIX}/projects/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_project_key_response(data)

    def list_projects(self) -> list[ProjectResponse]:
        data = self._send_request("GET", f"{API_PREFIX}/projects/")
        return [self._build_project_response(item) for item in data]

    def get_project(self, project_id: str | UUID) -> ProjectResponse:
        data = self._send_request("GET", f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}")
        return self._build_project_response(data)

    def update_project(
        self,
        project_id: str | UUID,
        name: str | None = None,
        description: str | None = None,
    ) -> ProjectResponse:
        payload = ProjectUpdateRequest(name=name, description=description)
        data = self._send_request(
            "PATCH",
            f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}",
            json=payload.model_dump(mode="json", exclude_none=True),
        )
        return self._build_project_response(data)

    def delete_project(self, project_id: str | UUID) -> bool:
        self._send_request("DELETE", f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}")
        return True

    def rotate_project_key(self, project_id: str | UUID) -> ProjectKeyResponse:
        data = self._send_request(
            "POST",
            f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}/api-key/rotate",
        )
        return self._build_project_key_response(data)

    def _send_request(self, method: str, path: str, **kwargs: Any) -> Any:
        last_exception: httpx.RequestError | None = None

        for attempt in range(MAX_ATTEMPTS):
            try:
                response = self._client.request(
                    method,
                    path,
                    headers=self._headers(),
                    timeout=self.timeout,
                    **kwargs,
                )
            except httpx.RequestError as exception:
                last_exception = exception
                if attempt < MAX_ATTEMPTS - 1:
                    time.sleep(2**attempt)
                    continue
                raise ServiceUnavailableError(
                    message=str(exception),
                    status_code=503,
                    code="service_unavailable",
                ) from exception

            if response.status_code in RETRYABLE_STATUS_CODES:
                if attempt < MAX_ATTEMPTS - 1:
                    time.sleep(2**attempt)
                    continue
                self._raise_for_response(response)

            return self._prepare_response(response)

        if last_exception is not None:
            raise ServiceUnavailableError(
                message=str(last_exception),
                status_code=503,
                code="service_unavailable",
            ) from last_exception

        raise ServiceUnavailableError(
            message="Request failed after retries",
            status_code=503,
            code="service_unavailable",
        )


class AsyncMouseBase(_BaseMouseBase):
    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: httpx.Timeout | float | None = DEFAULT_TIMEOUT,
        client: httpx.AsyncClient | None = None,
        user_agent: str | None = None,
    ) -> None:
        super().__init__(api_key=api_key, base_url=base_url, timeout=timeout, user_agent=user_agent)
        self._client = client or httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout)
        self._owns_client = client is None
        self.projects = AsyncProjectsResource(self)

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> AsyncMouseBase:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.aclose()

    async def remember(
        self,
        content: str,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> RememberResponse:
        payload = RememberRequest(content=content, external_id=external_id, metadata=metadata or {})
        data = await self._send_request(
            "POST",
            f"{API_PREFIX}/remember/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_remember_response(data)

    async def search(self, query: str, top_k: int = 10) -> SearchResponse:
        payload = SearchRequest(query=query, top_k=top_k)
        data = await self._send_request(
            "POST",
            f"{API_PREFIX}/search/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_search_response(data)

    async def get_memory(self, memory_id: str | UUID) -> MemoryResponse:
        data = await self._send_request("GET", f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}")
        return self._build_memory_response(data)

    async def update_memory(
        self,
        memory_id: str | UUID,
        content: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryResponse:
        payload = UpdateMemoryRequest(content=content, external_id=external_id, metadata=metadata)
        data = await self._send_request(
            "PATCH",
            f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}",
            json=payload.model_dump(mode="json", exclude_none=True),
        )
        return self._build_memory_response(data)

    async def delete_memory(self, memory_id: str | UUID) -> bool:
        await self._send_request("DELETE", f"{API_PREFIX}/memory/{self._coerce_uuid(memory_id)}")
        return True

    async def list_memories(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("The backend does not expose a list memories endpoint yet.")

    async def get(self, memory_id: str | UUID) -> MemoryResponse:
        return await self.get_memory(memory_id)

    async def update(
        self,
        memory_id: str | UUID,
        content: str | None = None,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryResponse:
        return await self.update_memory(
            memory_id,
            content=content,
            external_id=external_id,
            metadata=metadata,
        )

    async def delete(self, memory_id: str | UUID) -> bool:
        return await self.delete_memory(memory_id)

    async def create_project(
        self,
        name: str,
        description: str | None = None,
    ) -> ProjectKeyResponse:
        payload = ProjectCreateRequest(name=name, description=description)
        data = await self._send_request(
            "POST",
            f"{API_PREFIX}/projects/",
            json=payload.model_dump(mode="json"),
        )
        return self._build_project_key_response(data)

    async def list_projects(self) -> list[ProjectResponse]:
        data = await self._send_request("GET", f"{API_PREFIX}/projects/")
        return [self._build_project_response(item) for item in data]

    async def get_project(self, project_id: str | UUID) -> ProjectResponse:
        data = await self._send_request("GET", f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}")
        return self._build_project_response(data)

    async def update_project(
        self,
        project_id: str | UUID,
        name: str | None = None,
        description: str | None = None,
    ) -> ProjectResponse:
        payload = ProjectUpdateRequest(name=name, description=description)
        data = await self._send_request(
            "PATCH",
            f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}",
            json=payload.model_dump(mode="json", exclude_none=True),
        )
        return self._build_project_response(data)

    async def delete_project(self, project_id: str | UUID) -> bool:
        await self._send_request("DELETE", f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}")
        return True

    async def rotate_project_key(self, project_id: str | UUID) -> ProjectKeyResponse:
        data = await self._send_request(
            "POST",
            f"{API_PREFIX}/projects/{self._coerce_uuid(project_id)}/api-key/rotate",
        )
        return self._build_project_key_response(data)

    async def _send_request(self, method: str, path: str, **kwargs: Any) -> Any:
        last_exception: httpx.RequestError | None = None

        for attempt in range(MAX_ATTEMPTS):
            try:
                response = await self._client.request(
                    method,
                    path,
                    headers=self._headers(),
                    timeout=self.timeout,
                    **kwargs,
                )
            except httpx.RequestError as exception:
                last_exception = exception
                if attempt < MAX_ATTEMPTS - 1:
                    await asyncio.sleep(2**attempt)
                    continue
                raise ServiceUnavailableError(
                    message=str(exception),
                    status_code=503,
                    code="service_unavailable",
                ) from exception

            if response.status_code in RETRYABLE_STATUS_CODES:
                if attempt < MAX_ATTEMPTS - 1:
                    await asyncio.sleep(2**attempt)
                    continue
                self._raise_for_response(response)

            return self._prepare_response(response)

        if last_exception is not None:
            raise ServiceUnavailableError(
                message=str(last_exception),
                status_code=503,
                code="service_unavailable",
            ) from last_exception

        raise ServiceUnavailableError(
            message="Request failed after retries",
            status_code=503,
            code="service_unavailable",
        )
