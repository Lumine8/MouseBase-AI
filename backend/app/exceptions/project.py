from fastapi import status

from app.exceptions.base import APIException


class ProjectNotFoundError(APIException):
    def __init__(self):
        super().__init__(
            code="project_not_found",
            message="Project not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class EmptyProjectUpdateError(APIException):
    def __init__(self):
        super().__init__(
            code="empty_update",
            message="No fields provided for project update",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class ProjectLimitError(APIException):
    def __init__(self, message: str):
        super().__init__(
            code="project_limit_reached",
            message=message,
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
        )
