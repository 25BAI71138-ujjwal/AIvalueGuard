from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database import engine, Base, AsyncSessionLocal
from backend.app.seed import seed_initial_data

from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_gateway import router as gateway_router
from backend.app.api.routes_playground import router as playground_router
from backend.app.api.routes_requests import router as requests_router
from backend.app.api.routes_models import router as models_router
from backend.app.api.routes_cache import router as cache_router
from backend.app.api.routes_evaluations import router as evals_router
from backend.app.api.routes_analytics import router as analytics_router
from backend.app.api.routes_experiments import router as experiments_router
from backend.app.api.routes_settings import router as settings_router
from backend.app.api.routes_budget import router as budget_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default data
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

    yield

    # Clean shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-quality AI Cost Optimization Platform | PS-08",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development & demo, allow frontend proxy & direct calls
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(gateway_router, prefix=settings.API_PREFIX)
app.include_router(playground_router, prefix=settings.API_PREFIX)
app.include_router(requests_router, prefix=settings.API_PREFIX)
app.include_router(models_router, prefix=settings.API_PREFIX)
app.include_router(cache_router, prefix=settings.API_PREFIX)
app.include_router(evals_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(experiments_router, prefix=settings.API_PREFIX)
app.include_router(settings_router, prefix=settings.API_PREFIX)
app.include_router(budget_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": "Optimize AI Costs. Preserve Quality. Scale Intelligently.",
        "version": settings.VERSION,
        "documentation": "/docs",
        "demo_mode": settings.DEMO_MODE,
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
