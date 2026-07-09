from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from mousebase.errors import (
    MissingAPIKeyError,
    MouseBaseError,
    translate_error,
)
from mousebase.models import (
    ApiKeyResponse,
    AuthResponse,
    MemoryResponse,
    ProjectKeyResponse,
    ProjectResponse,
    RememberResponse,
    SearchResponse,
    UserResponse,
)

DEFAULT_BASE_URL = "https://api.mousebase.ai/v1"
DEFAULT_TIMEOUT = 30


class _Projects:
    def __init__(self, client: MouseBase):
        self._client = client

    def create(self, name: str, description: str | None = None) -> ProjectKeyResponse:
        body = self._client._request("POST", "/projects", json={"name": name, "description": description})
        return ProjectKeyResponse.model_validate(body)

    def list(self) -> list[ProjectKeyResponse]:
        body = self._client._request("GET", "/projects")
        return [ProjectKeyResponse.model_validate(p) for p in body]

    def get(self, project_id: str) -> ProjectKeyResponse:
        body = self._client._request("GET", f"/projects/{project_id}")
        return ProjectKeyResponse.model_validate(body)

    def update(self, project_id: str, name: str | None = None, description: str | None = None) -> ProjectResponse:
        body = self._client._request("PATCH", f"/projects/{project_id}", json={"name": name, "description": description})
        return ProjectResponse.model_validate(body)

    def delete(self, project_id: str) -> None:
        self._client._request("DELETE", f"/projects/{project_id}")

    def view_key(self, project_id: str) -> ApiKeyResponse:
        body = self._client._request("GET", f"/projects/{project_id}/api-key")
        return ApiKeyResponse.model_validate(body)

    def rotate_key(self, project_id: str) -> ProjectKeyResponse:
        body = self._client._request("POST", f"/projects/{project_id}/rotate-key")
        return ProjectKeyResponse.model_validate(body)


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, (httpx.NetworkError, httpx.TimeoutException)):
        return True
    if isinstance(exc, MouseBaseError):
        if exc.status_code in (429, 500, 502, 503):
            return True
        if exc.code in ("timeout", "network_error"):
            return True
    return False


def _try_load_dotenv() -> None:
    env_path = Path.cwd() / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path, override=False)
        except Exception:
            pass


class MouseBase:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        _try_load_dotenv()

        if api_key is None:
            api_key = os.getenv("MOUSEBASE_API_KEY")
        if api_key is None:
            raise MissingAPIKeyError()

        self.api_key = api_key
        self.base_url = (base_url or os.getenv("MOUSEBASE_BASE_URL")) or DEFAULT_BASE_URL
        self.timeout = timeout

        self._client = httpx.Client(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(timeout),
        )
        self.projects = _Projects(self)

    @retry(
        retry=retry_if_exception(_is_retryable),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Any:
        try:
            response = self._client.request(method, path, **kwargs)
        except httpx.TimeoutException as e:
            raise MouseBaseError(str(e), code="timeout", status_code=0)
        except httpx.NetworkError as e:
            raise MouseBaseError(str(e), code="network_error")

        if response.is_success:
            if response.status_code == 204:
                return None
            return response.json()

        raise translate_error(response)

    def remember(
        self,
        content: str,
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> RememberResponse:
        body = {"content": content}
        if external_id is not None:
            body["external_id"] = external_id
        if metadata is not None:
            body["metadata"] = metadata
        data = self._request("POST", "/remember/", json=body)
        return RememberResponse.model_validate(data)

    def search(
        self,
        query: str,
        top_k: int = 10,
    ) -> SearchResponse:
        body = {"query": query, "top_k": top_k}
        data = self._request("POST", "/search/", json=body)
        return SearchResponse.model_validate(data)

    def get(self, memory_id: str) -> MemoryResponse:
        data = self._request("GET", f"/memory/{memory_id}")
        return MemoryResponse.model_validate(data)

    def update(
        self,
        memory_id: str,
        content: str | None = None,
        metadata: dict[str, Any] | None = None,
        external_id: str | None = None,
    ) -> MemoryResponse:
        body: dict[str, Any] = {}
        if content is not None:
            body["content"] = content
        if metadata is not None:
            body["metadata"] = metadata
        if external_id is not None:
            body["external_id"] = external_id
        data = self._request("PATCH", f"/memory/{memory_id}", json=body)
        return MemoryResponse.model_validate(data)

    def delete(self, memory_id: str) -> None:
        self._request("DELETE", f"/memory/{memory_id}")

    def signup(self, email: str, password: str, full_name: str | None = None) -> AuthResponse:
        body = {"email": email, "password": password}
        if full_name is not None:
            body["full_name"] = full_name
        data = self._request("POST", "/auth/signup", json=body)
        return AuthResponse.model_validate(data)

    def login(self, email: str, password: str) -> AuthResponse:
        body = {"email": email, "password": password}
        data = self._request("POST", "/auth/login", json=body)
        return AuthResponse.model_validate(data)

    def me(self) -> UserResponse:
        data = self._request("GET", "/auth/me")
        return UserResponse.model_validate(data)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> MouseBase:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
