from __future__ import annotations

import time
from collections import defaultdict
from uuid import UUID

from fastapi import HTTPException


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int = 3600
    ) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]
        count = len(self._requests[key])
        if count >= max_requests:
            return False, count
        self._requests[key].append(now)
        return True, count + 1

    def get_remaining(self, key: str, max_requests: int) -> int:
        now = time.time()
        cutoff = now - 3600
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]
        return max(0, max_requests - len(self._requests[key]))


rate_limiter = InMemoryRateLimiter()


async def enforce_rate_limit(owner_id: UUID, requests_per_hour: int) -> None:
    key = f"rate:{owner_id}"
    allowed, count = rate_limiter.check_rate_limit(key, requests_per_hour)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({requests_per_hour} requests/hour)",
        )
