from fastapi import status
from app.exceptions.base import APIException


class MemoryNotFoundError(APIException):
    def __init__(self):
        super().__init__(
            code="memory_not_found",
            message="Memory not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
