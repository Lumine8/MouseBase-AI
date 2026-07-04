from fastapi import FastAPI

from app.routers.remember import router as remember_router

app = FastAPI(
    title="MouseBase Memory API",
    version="0.1.0"
)

app.include_router(remember_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "MouseBase Memory API"
    }

