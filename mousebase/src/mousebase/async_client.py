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
    MessageResponse,
    ProjectKeyResponse,
    ProjectResponse,
    RefreshResponse,
    RememberResponse,
    SearchResponse,
    SessionResponse,
    UserResponse,
)

DEFAULT_BASE_URL = "https://api.mousebase.dev/api/v1"
DEFAULT_TIMEOUT = 30


class _AsyncProjects:
    def __init__(self, client: AsyncMouseBase):
        self._client = client

    async def create(
        self, name: str, description: str | None = None
    ) -> ProjectKeyResponse:
        body = await self._client._request(
            "POST", "/projects", json={"name": name, "description": description}
        )
        return ProjectKeyResponse.model_validate(body)

    async def list(self) -> list[ProjectKeyResponse]:
        body = await self._client._request("GET", "/projects")
        return [ProjectKeyResponse.model_validate(p) for p in body]

    async def get(self, project_id: str) -> ProjectKeyResponse:
        body = await self._client._request("GET", f"/projects/{project_id}")
        return ProjectKeyResponse.model_validate(body)

    async def update(
        self, project_id: str, name: str | None = None, description: str | None = None
    ) -> ProjectResponse:
        body = await self._client._request(
            "PATCH",
            f"/projects/{project_id}",
            json={"name": name, "description": description},
        )
        return ProjectResponse.model_validate(body)

    async def delete(self, project_id: str) -> None:
        await self._client._request("DELETE", f"/projects/{project_id}")

    async def view_key(self, project_id: str) -> ApiKeyResponse:
        body = await self._client._request("GET", f"/projects/{project_id}/api-key")
        return ApiKeyResponse.model_validate(body)

    async def rotate_key(self, project_id: str) -> ProjectKeyResponse:
        body = await self._client._request("POST", f"/projects/{project_id}/rotate-key")
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


class AsyncMouseBase:
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
        self.base_url = (
            base_url or os.getenv("MOUSEBASE_BASE_URL")
        ) or DEFAULT_BASE_URL
        self.timeout = timeout

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(timeout),
        )
        self.projects = _AsyncProjects(self)

    @retry(
        retry=retry_if_exception(_is_retryable),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Any:
        try:
            response = await self._client.request(method, path, **kwargs)
        except httpx.TimeoutException as e:
            raise MouseBaseError(str(e), code="timeout", status_code=0)
        except httpx.NetworkError as e:
            raise MouseBaseError(str(e), code="network_error")

        if response.is_success:
            if response.status_code == 204:
                return None
            return response.json()

        raise translate_error(response)

    async def remember(
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
        data = await self._request("POST", "/remember/", json=body)
        return RememberResponse.model_validate(data)

    async def search(
        self,
        query: str,
        top_k: int = 10,
    ) -> SearchResponse:
        body = {"query": query, "top_k": top_k}
        data = await self._request("POST", "/search/", json=body)
        return SearchResponse.model_validate(data)

    async def get(self, memory_id: str) -> MemoryResponse:
        data = await self._request("GET", f"/memory/{memory_id}")
        return MemoryResponse.model_validate(data)

    async def update(
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
        data = await self._request("PATCH", f"/memory/{memory_id}", json=body)
        return MemoryResponse.model_validate(data)

    async def delete(self, memory_id: str) -> None:
        await self._request("DELETE", f"/memory/{memory_id}")

    async def signup(
        self, email: str, password: str, full_name: str | None = None
    ) -> AuthResponse:
        body = {"email": email, "password": password}
        if full_name is not None:
            body["full_name"] = full_name
        data = await self._request("POST", "/auth/signup", json=body)
        return AuthResponse.model_validate(data)

    async def login(self, email: str, password: str) -> AuthResponse:
        body = {"email": email, "password": password}
        data = await self._request("POST", "/auth/login", json=body)
        return AuthResponse.model_validate(data)

    async def refresh(self, refresh_token: str) -> RefreshResponse:
        data = await self._request(
            "POST", "/auth/refresh", json={"refresh_token": refresh_token}
        )
        return RefreshResponse.model_validate(data)

    async def verify_email(self, token: str) -> MessageResponse:
        data = await self._request("POST", "/auth/verify-email", json={"token": token})
        return MessageResponse.model_validate(data)

    async def resend_verification(self) -> MessageResponse:
        data = await self._request("POST", "/auth/resend-verification")
        return MessageResponse.model_validate(data)

    async def forgot_password(self, email: str) -> MessageResponse:
        data = await self._request(
            "POST", "/auth/forgot-password", json={"email": email}
        )
        return MessageResponse.model_validate(data)

    async def reset_password(self, token: str, password: str) -> MessageResponse:
        data = await self._request(
            "POST", "/auth/reset-password", json={"token": token, "password": password}
        )
        return MessageResponse.model_validate(data)

    async def list_sessions(self) -> list[SessionResponse]:
        data = await self._request("GET", "/auth/sessions")
        return [SessionResponse.model_validate(s) for s in data]

    async def revoke_session(self, session_id: str) -> MessageResponse:
        data = await self._request("DELETE", f"/auth/sessions/{session_id}")
        return MessageResponse.model_validate(data)

    async def revoke_all_sessions(self) -> MessageResponse:
        data = await self._request("DELETE", "/auth/sessions")
        return MessageResponse.model_validate(data)

    async def me(self) -> UserResponse:
        data = await self._request("GET", "/auth/me")
        return UserResponse.model_validate(data)

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> AsyncMouseBase:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
