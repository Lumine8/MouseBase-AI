from fastapi import status
from app.exceptions.base import APIException


class InvalidAPIKeyError(APIException):
    def __init__(self):
        super().__init__(
            code="invalid_api_key",
            message="Invalid API key",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class InvalidTokenError(APIException):
    def __init__(self):
        super().__init__(
            code="invalid_token",
            message="Invalid or expired token",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class InvalidCredentialsError(APIException):
    def __init__(self):
        super().__init__(
            code="invalid_credentials",
            message="Invalid email or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class EmailAlreadyExistsError(APIException):
    def __init__(self):
        super().__init__(
            code="email_already_exists",
            message="An account with this email already exists",
            status_code=status.HTTP_409_CONFLICT,
        )


class EmailNotVerifiedError(APIException):
    def __init__(self):
        super().__init__(
            code="email_not_verified",
            message="Email not verified",
            status_code=status.HTTP_403_FORBIDDEN,
        )
