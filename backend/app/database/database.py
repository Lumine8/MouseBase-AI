from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo = settings.ENVIRONMENT == "development")

AsyncSessionLocal = AsyncSession(bind = engine, class_= AsyncSession, expire_on_commit = False)