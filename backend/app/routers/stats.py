import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/downloads")
async def get_download_stats():
    pypi_data = {}
    npm_data = {}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get("https://pypistats.org/api/packages/mousebase/recent")
            if resp.status_code == 200:
                pypi_data = resp.json().get("data", {})
        except Exception:
            pass

        try:
            resp = await client.get("https://api.npmjs.org/downloads/point/last-week/mousebase")
            if resp.status_code == 200:
                npm_data = resp.json()
        except Exception:
            pass

        try:
            resp = await client.get("https://api.npmjs.org/downloads/point/last-month/mousebase")
            if resp.status_code == 200:
                npm_data["last_month"] = resp.json().get("downloads", 0)
        except Exception:
            pass

    return {
        "pypi": {
            "last_day": pypi_data.get("last_day", 0),
            "last_week": pypi_data.get("last_week", 0),
            "last_month": pypi_data.get("last_month", 0),
        },
        "npm": {
            "last_week": npm_data.get("downloads", 0),
            "last_month": npm_data.get("last_month", 0),
        },
        "total": {
            "last_month": pypi_data.get("last_month", 0) + npm_data.get("last_month", 0),
        },
    }
