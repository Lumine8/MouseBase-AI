from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class MouseBaseError(Exception):
    message: str
    status_code: int | None = None
    code: str | None = None

    def __str__(self) -> str:
        if self.code:
            return f"{self.code}: {self.message}"
        return self.message


class APIError(MouseBaseError):
    pass


class AuthenticationError(APIError):
    pass


class ValidationError(APIError):
    pass


class RateLimitError(APIError):
    pass


class ServiceUnavailableError(APIError):
    pass


class MemoryNotFoundError(APIError):
    pass


class ProjectNotFoundError(APIError):
    pass
