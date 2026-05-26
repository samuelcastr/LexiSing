from fastapi import FastAPI
from app.api.api_v1.router import api_router

app = FastAPI(
    title="LexiSing Backend",
    description="API base para LexiSing usando FastAPI",
    version="0.1.0",
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["root"])
def read_root():
    return {"message": "Bienvenido al backend de LexiSing"}
