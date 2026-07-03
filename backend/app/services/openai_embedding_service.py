from openai import AsyncOpenAI

from app.core.config import settings
from app.services.embedding_service import EmbeddingService

class OpenAIEmbeddingService(EmbeddingService):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def embed(self, text: str) -> list[float]:
        response = await self.client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text
        )
        
        vector = response.data[0].embedding

        if len(vector) != settings.EMBEDDING_DIMENSIONS:
            raise RuntimeError(f"Expected embedding dimensions: {settings.EMBEDDING_DIMENSIONS}, but got: {len(vector)}")
        print(f"Embedding dimensions: {len(vector)}")

        return vector
        
        
