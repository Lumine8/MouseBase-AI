import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/stats", tags=["stats"])

HEADERS = {
    "User-Agent": "MouseBase/0.1.0 (https://mousebase.dev)",
}


@router.get("/downloads")
async def get_download_stats():
    pypi_data = {}
    npm_week = 0
    npm_month = 0

    async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
        try:
            resp = await client.get(
                "https://pypistats.org/api/packages/mousebase/recent"
            )
            if resp.status_code == 200:
                pypi_data = resp.json().get("data", {})
        except Exception:
            pass

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
