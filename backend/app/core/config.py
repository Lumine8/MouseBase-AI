from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from enum import Enum

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class EmbeddingProvider(str, Enum):
    OPENAI = "openai"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"

    EMBEDDING_PROVIDER: str = EmbeddingProvider.OPENAI
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    # Must match the actual output dimension of EMBEDDING_MODEL.
    # Changing one without the other will break inserts or silently corrupt vectors.
    EMBEDDING_DIMENSIONS: int = 1536

    OPENAI_API_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )

settings = Settings()