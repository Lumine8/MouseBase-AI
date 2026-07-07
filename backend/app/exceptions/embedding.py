from fastapi import status
from app.exceptions.base import APIException

class EmbeddingServiceUnavailableError(APIException):
    def __init__(self):
        super().__init__(
            code="embedding_unavailable",
            message="Embedding service is currently unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )