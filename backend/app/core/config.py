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

    MIN_SCORE: float = Field(default=0.65, ge=0.0, le=1.0)

    JWT_SECRET: str = "dev-jwt-secret-do-not-use-in-production"
    JWT_EXPIRY_HOURS: int = 72

    REDIS_URL: str = "redis://localhost:6379/0"

    FRONTEND_URL: str = "http://localhost:5173"

    API_KEY_ENCRYPTION_KEY: str = ""

    RAZORPAY_KEY_ID: str = "rzp_test_TB2VM5X7PpcyWj"
    RAZORPAY_KEY_SECRET: str = "dBl2qXe0Lfya1XzNt2cHmJbN"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXX"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()
