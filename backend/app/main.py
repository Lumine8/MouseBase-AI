from fastapi import FastAPI

app = FastAPI(
    title="mousebase Memory API",
    version="0.1.0"
)

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "mousebase Memory API"
    }