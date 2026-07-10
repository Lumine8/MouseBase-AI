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

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    SENTRY_DSN: str | None = None

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@mousebase.dev"

    JWT_REFRESH_EXPIRY_DAYS: int = 30
    JWT_ACCESS_EXPIRY_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()
