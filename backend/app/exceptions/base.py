from fastapi import status


class APIException(Exception):
    def __init__(
        self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
