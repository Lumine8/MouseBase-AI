from fastapi import status
from app.exceptions.base import APIException

class EmptyUpdateError(APIException):
    def __init__(self):
        super().__init__(
            code="empty_update",
            message="No fields provided for update",
            status_code=status.HTTP_400_BAD_REQUEST
        )