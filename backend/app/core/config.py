from pydantic import Field
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from enum import Enum

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class EmbeddingProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"

    EMBEDDING_PROVIDER: EmbeddingProvider = EmbeddingProvider.GEMINI

    EMBEDDING_MODEL: str = "gemini-embedding-001"

    EMBEDDING_DIMENSIONS: int = 3072  # Verify after first successful request.

    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    MIN_SCORE: float = Field(default=0.70, ge=0.0, le=1.0)

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )

settings = Settings()