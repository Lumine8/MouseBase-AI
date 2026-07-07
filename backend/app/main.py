from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routers.remember import router as remember_router
from app.routers.search import router as search_router
from app.routers.memory import router as memory_router

from app.exceptions.base import APIException

app = FastAPI(
    title="MouseBase Memory API",
    version="0.1.0"
)

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error":{
                "code":exc.code,
                "message":exc.message
            }
        }
    )
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error":{
                "code":"INTERNAL_SERVER_ERROR",
                "message":"An unexpected error occurred"
            }
        }
    )


app.include_router(remember_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "MouseBase Memory API"
    }

