import asyncio
import httpx
from fastapi import APIRouter

from app.core.config import APP_VERSION

router = APIRouter(prefix="/stats", tags=["stats"])

HEADERS = {
    "User-Agent": f"MouseBase/{APP_VERSION} (https://mousebase.dev)",
}

# Cache to avoid hammering pypistats.org (aggressive rate limits)
_pypi_cache: dict = {}
_pypi_cache_ts: float = 0


async def _fetch_pypi_stats() -> dict:
    global _pypi_cache, _pypi_cache_ts
    import time

    now = time.time()
    # Cache for 1 hour
    if _pypi_cache and (now - _pypi_cache_ts) < 3600:
        return _pypi_cache

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
                resp = await client.get(
                    "https://pypistats.org/api/packages/mousebase/recent"
                )
                if resp.status_code == 200:
                    _pypi_cache = resp.json().get("data", {})
                    _pypi_cache_ts = now
                    return _pypi_cache
                if resp.status_code == 429:
                    await asyncio.sleep(2**attempt)
        except Exception:
            await asyncio.sleep(1)

    return _pypi_cache or {}


@router.get("/downloads")
async def get_download_stats():
    pypi_data = await _fetch_pypi_stats()
    npm_week = 0
    npm_month = 0

    async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
        try:
            resp = await client.get(
                "https://api.npmjs.org/downloads/point/last-week/mousebase"
            )
            if resp.status_code == 200:
                npm_week = resp.json().get("downloads", 0)
        except Exception:
            pass

        try:
            resp = await client.get(
                "https://api.npmjs.org/downloads/point/last-month/mousebase"
            )
            if resp.status_code == 200:
                npm_month = resp.json().get("downloads", 0)
        except Exception:
            pass

    return {
        "pypi": {
            "last_day": pypi_data.get("last_day", 0),
            "last_week": pypi_data.get("last_week", 0),
            "last_month": pypi_data.get("last_month", 0),
        },
        "npm": {
            "last_week": npm_week,
            "last_month": npm_month,
        },
        "total": {
            "last_month": pypi_data.get("last_month", 0) + npm_month,
        },
    }
