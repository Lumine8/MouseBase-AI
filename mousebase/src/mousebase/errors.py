import httpx


class MouseBaseError(Exception):
    def __init__(self, message: str, code: str = "", status_code: int = 0):
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class MissingAPIKeyError(MouseBaseError):
    def __init__(self):
        super().__init__(
            "MOUSEBASE_API_KEY not set. Pass it explicitly or set the "
            "MOUSEBASE_API_KEY environment variable.",
            code="missing_api_key",
        )


class ValidationError(MouseBaseError):
    def __init__(
        self, message: str, code: str = "validation_error", status_code: int = 400
    ):
        super().__init__(message, code=code, status_code=status_code)


class AuthenticationError(MouseBaseError):
    def __init__(
        self, message: str, code: str = "invalid_api_key", status_code: int = 401
    ):
        super().__init__(message, code=code, status_code=status_code)


class ConflictError(MouseBaseError):
    def __init__(self, message: str, code: str = "conflict", status_code: int = 409):
        super().__init__(message, code=code, status_code=status_code)


class RateLimitError(MouseBaseError):
    def __init__(
        self, message: str, code: str = "rate_limited", status_code: int = 429
    ):
        super().__init__(message, code=code, status_code=status_code)


class EmbeddingProviderError(MouseBaseError):
    def __init__(
        self,
        message: str,
        code: str = "embedding_provider_unavailable",
        status_code: int = 503,
    ):
        super().__init__(message, code=code, status_code=status_code)


class InternalError(MouseBaseError):
    def __init__(
        self, message: str, code: str = "internal_error", status_code: int = 500
    ):
        super().__init__(message, code=code, status_code=status_code)


_ERROR_MAP: dict[int, type[MouseBaseError]] = {
    400: ValidationError,
    401: AuthenticationError,
    409: ConflictError,
    429: RateLimitError,
    500: InternalError,
    502: InternalError,
    503: EmbeddingProviderError,
}


def translate_error(response: httpx.Response) -> MouseBaseError:
    body = _parse_error_body(response)
    status = response.status_code
    cls = _ERROR_MAP.get(status, MouseBaseError)
    return cls(message=body["message"], code=body["code"], status_code=status)


def _parse_error_body(response: httpx.Response) -> dict:
    try:
        data = response.json()
        error = data.get("error", {})
        return {
            "code": error.get("code", "unknown_error"),
            "message": error.get("message", "Unknown error"),
        }
    except Exception:
        return {
            "code": "unknown_error",
            "message": f"HTTP {response.status_code}: {response.reason_phrase}",
        }
