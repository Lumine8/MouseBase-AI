from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.services.gemini_embedding_service import GeminiEmbeddingService
from app.services.openai_embedding_service import OpenAIEmbeddingService


def create_embedding_service() -> EmbeddingService:
    if settings.EMBEDDING_PROVIDER == "openai":
        return OpenAIEmbeddingService()
    return GeminiEmbeddingService()
