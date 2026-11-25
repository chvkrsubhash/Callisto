from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db.mongodb import mongo
from .routers import ai, collab, diagrams


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await mongo.connect()
    except Exception:
        # Allows health checks / offline startup when MongoDB is not yet running
        pass
    yield
    await mongo.close()


app = FastAPI(
    title="Callisto API",
    description="Callisto — Professional Diagramming and UML Design Platform | AkashaVyom Labs",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagrams.router)
app.include_router(ai.router)
app.include_router(collab.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "product": "Callisto",
        "organization": "AkashaVyom Labs",
    }

