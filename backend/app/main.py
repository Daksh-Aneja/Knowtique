"""Knowtique — FastAPI Application Entry Point"""
import logging

logger = logging.getLogger(__name__)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.seed import seed_database
from app.api.routes import rules, skills, dashboard, elicitation
from app.api.routes import extraction, provenance, redteam, benchmark, topology
from app.api.routes import connectors, conflicts, marketplace, security, pipeline, predictive, polymorphic, federated, knowtique10x, platform_config
from app.api.routes import enterprise
from app.api.routes import agent_factory
from app.api.routes import pioneer
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables + seed data. Shutdown: cleanup."""
    await init_db()
    async with AsyncSessionLocal() as session:
        seeded = await seed_database(session)
        if seeded:
            logger.info("Database seeded with Knowtique demo data")
        else:
            logger.info("Database already contains data, skipping seed")
            
    # L7 Temporal Decay Scheduler (hourly)
    from app.services.lifecycle import DecayManager
    import asyncio
    
    decay_mgr = DecayManager()
    async def decay_loop():
        while True:
            try:
                await decay_mgr.run_decay_scheduler()
            except Exception as e:
                logger.warning(f"Decay scheduler error: {e}")
            await asyncio.sleep(3600)
    
    decay_task = asyncio.create_task(decay_loop())
    
    # L24 Pre-Cog Asynchronous Loop
    from app.services.precog_engine import PreCogEngine
    engine = PreCogEngine()
    precog_task = asyncio.create_task(engine.run_ambient_loop())
    
    yield
    
    engine.is_running = False
    precog_task.cancel()
    decay_task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Knowtique — Enterprise Agentic Knowledge Platform | Epistemic Operating System",
    lifespan=lifespan,
)

# CORS — configurable via CORS_ORIGINS env var (comma-separated)
_default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]
_cors_origins = (
    [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    if settings.CORS_ORIGINS
    else _default_origins
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    # Allow any local/LAN IP during dev, but lock down if CORS_ORIGINS is explicitly set
    allow_origin_regex=r"https?://.*" if not settings.CORS_ORIGINS else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(rules.router, prefix=settings.API_PREFIX)
app.include_router(skills.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(elicitation.router, prefix=settings.API_PREFIX)
app.include_router(extraction.router, prefix=settings.API_PREFIX)
app.include_router(provenance.router, prefix=settings.API_PREFIX)
app.include_router(redteam.router, prefix=settings.API_PREFIX)
app.include_router(benchmark.router, prefix=settings.API_PREFIX)
app.include_router(topology.router, prefix=settings.API_PREFIX)
app.include_router(connectors.router, prefix=settings.API_PREFIX)
app.include_router(conflicts.router, prefix=settings.API_PREFIX)
app.include_router(marketplace.router, prefix=settings.API_PREFIX)
app.include_router(security.router, prefix=settings.API_PREFIX)
app.include_router(pipeline.router, prefix=settings.API_PREFIX)
app.include_router(predictive.router, prefix=settings.API_PREFIX)
app.include_router(polymorphic.router, prefix=settings.API_PREFIX)
app.include_router(federated.router, prefix=settings.API_PREFIX)
app.include_router(knowtique10x.router, prefix=settings.API_PREFIX)
app.include_router(platform_config.router, prefix=settings.API_PREFIX)
app.include_router(enterprise.router, prefix=settings.API_PREFIX)
app.include_router(agent_factory.router, prefix=settings.API_PREFIX)
app.include_router(pioneer.router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "platform": "Knowtique Epistemic OS",
        "modes": ["HARVEST", "ELICITATION", "EXECUTION", "REFLECTION", "EVOLUTION"],
    }
