from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

from app.routers.remember import router as remember_router
from app.routers.search import router as search_router
from app.routers.memory import router as memory_router
from app.routers.projects import router as projects_router
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.payments import router as payments_router

from app.exceptions.base import APIException

app = FastAPI(title="MouseBase Memory API", version="0.1.0")

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


@app.get("/")
def root():
    return {"status": "ok", "service": "MouseBase Memory API"}
