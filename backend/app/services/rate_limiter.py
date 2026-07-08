from __future__ import annotations

from uuid import UUID

from app.core.config import settings


class RateLimiter:
    def __init__(self) -> None:
        self.redis = None

    async def _get_redis(self):
        if self.redis is None:
            try:
                import redis.asyncio as aioredis
                self.redis = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True
                )
            except Exception:
                return None
        return self.redis

    async def check_rate_limit(
        self, user_id: UUID, max_requests: int, window_seconds: int = 3600
    ) -> tuple[bool, int]:
        client = await self._get_redis()
        if client is None:
            return True, 0

        key = f"rate_limit:{user_id}:{window_seconds}"
        current = await client.get(key)

        if current is None:
            await client.setex(key, window_seconds, 1)
            return True, 1

        count = int(current)
        if count >= max_requests:
            return False, count

        await client.incr(key)
        return True, count + 1

    async def get_remaining(self, user_id: UUID, max_requests: int) -> int:
        client = await self._get_redis()
        if client is None:
            return max_requests

        key = f"rate_limit:{user_id}:3600"
        current = await client.get(key)
        if current is None:
            return max_requests
        return max(0, max_requests - int(current))


rate_limiter = RateLimiter()
