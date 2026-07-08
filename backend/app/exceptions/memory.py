from fastapi import status
from app.exceptions.base import APIException


class MemoryNotFoundError(APIException):
    def __init__(self):
        super().__init__(
            code="memory_not_found",
            message="Memory not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class MemoryLimitError(APIException):
    def __init__(self, message: str):
        super().__init__(
            code="memory_limit_reached",
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
        )
