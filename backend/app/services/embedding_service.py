

from app.exceptions.embedding import EmbeddingServiceUnavailableError


class EmbeddingService:
    async def embed(self, text: str) -> list[float]:
        
        raise EmbeddingServiceUnavailableError()