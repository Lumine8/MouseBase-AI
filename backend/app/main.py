import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.core.config import settings
from app.core.log_config import get_logger, setup_logging
from app.core.middleware import (
    RequestIDMiddleware,
    RequestTimingMiddleware,
    SecurityHeadersMiddleware,
)
from app.db.database import AsyncSessionLocal
from app.db.dependencies import check_db

from app.routers.remember import router as remember_router
from app.routers.search import router as search_router
from app.routers.memory import router as memory_router
from app.routers.projects import router as projects_router
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.payments import router as payments_router
from app.routers.explorer import router as explorer_router

from app.exceptions.base import APIException

logger = get_logger(__name__)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    enabled=settings.ENVIRONMENT != "development",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info(
        "starting up", service="MouseBase Memory API", environment=settings.ENVIRONMENT
    )

    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
        logger.info("sentry initialized")

    db_ok = await check_db()
    if db_ok:
        logger.info("database connection healthy")
    else:
        logger.warning("database connection failed during startup")

    yield

    logger.info("shutting down")


app = FastAPI(title="MouseBase Memory API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestTimingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {"msg": "Validation error"}
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "validation_error",
                "message": first_error["msg"],
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None)
    logger.exception("unhandled exception", request_id=request_id)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
            }
        },
    )


app.include_router(auth_router, prefix="/api/v1")
app.include_router(remember_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(explorer_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "ok", "service": "MouseBase Memory API"}


@app.get("/health/")
async def health():
    db_ok = False
    db_latency = None
    try:
        async with AsyncSessionLocal() as session:
            start = time.monotonic()
            await session.execute(text("SELECT 1"))
            db_latency = round((time.monotonic() - start) * 1000)
            db_ok = True
    except Exception as e:
        logger.error("health check db failed", error=str(e))

    status = "healthy" if db_ok else "degraded"
    status_code = 200 if db_ok else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": status,
            "service": "MouseBase Memory API",
            "version": "0.1.0",
            "checks": {
                "database": {
                    "status": "up" if db_ok else "down",
                    "latency_ms": db_latency,
                }
            },
        },
    )
