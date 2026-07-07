from google import genai

from app.core.config import settings
from app.services.embedding_service import EmbeddingService


class GeminiEmbeddingService(EmbeddingService):
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def embed(self, text: str) -> list[float]:
        if not text.strip():
            raise ValueError("Text cannot be empty.")

        response = await self.client.aio.models.embed_content(
            model=settings.EMBEDDING_MODEL,
            contents=text,
        )

        vector = response.embeddings[0].values

        if len(vector) != settings.EMBEDDING_DIMENSIONS:
            raise RuntimeError(f"Expected {settings.EMBEDDING_DIMENSIONS} dimensions")

        return vector
