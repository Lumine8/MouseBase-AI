import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture(autouse=True)
def mock_exchange_rate(monkeypatch: pytest.MonkeyPatch):
    async def fake_rate(_currency: str) -> float:
        return 1.0
    monkeypatch.setattr(
        "app.services.payment_service.get_rate",
        fake_rate,
    )


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
