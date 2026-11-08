from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.watchlist import init_db
from app.deps import close_meteo_client
from app.routers import locations, reports, watchlist


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield
    await close_meteo_client()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
