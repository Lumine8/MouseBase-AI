from fastapi import status
from app.exceptions.base import APIException

class InvalidAPIKeyError(APIException):
    def __init__(self):
        super().__init__(
            code="invalid_api_key",
            message="Invalid API key",
            status_code=status.HTTP_401_UNAUTHORIZED
        )