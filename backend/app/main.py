"""
Knowtique — main.py (updated)
Changes from original:
  1. TenantMiddleware registered before all routers
  2. Platform config API routes added for API key management
"""
import logging

logger = logging.getLogger(__name__)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.seed import seed_database
from app.core.tenant import TenantMiddleware                # ← NEW

from app.api.routes import (
    rules, skills, dashboard, elicitation,
    extraction, provenance, redteam, benchmark, topology,
    connectors, conflicts, marketplace, security, pipeline,
    predictive, polymorphic, federated, knowtique10x,
    platform_config, enterprise, agent_factory, pioneer,
)

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

        from app.core.auth import initialize_dev_mode
        initialize_dev_mode()
    yield
    # Shutdown cleanup (close connection pools etc.) goes here if needed


app = FastAPI(
    title="Knowtique API",
    version=settings.APP_VERSION,
    description="Enterprise Agentic Knowledge Platform — Powered by AEOS",
    lifespan=lifespan,
)

# ── Middleware (order matters — outermost runs first) ─────────────────────────

# CORS must be outermost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if hasattr(settings, "CORS_ORIGINS") else ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenant resolution — runs after CORS, before all route handlers
app.add_middleware(TenantMiddleware)                        # ← NEW

# ── Routers ───────────────────────────────────────────────────────────────────

PREFIX = settings.API_PREFIX  # "/api/v1"

app.include_router(dashboard.router,       prefix=PREFIX)
app.include_router(rules.router,           prefix=PREFIX)
app.include_router(skills.router,          prefix=PREFIX)
app.include_router(elicitation.router,     prefix=PREFIX)
app.include_router(extraction.router,      prefix=PREFIX)
app.include_router(provenance.router,      prefix=PREFIX)
app.include_router(redteam.router,         prefix=PREFIX)
app.include_router(benchmark.router,       prefix=PREFIX)
app.include_router(topology.router,        prefix=PREFIX)
app.include_router(connectors.router,      prefix=PREFIX)
app.include_router(conflicts.router,       prefix=PREFIX)
app.include_router(marketplace.router,     prefix=PREFIX)
app.include_router(security.router,        prefix=PREFIX)
app.include_router(pipeline.router,        prefix=PREFIX)
app.include_router(predictive.router,      prefix=PREFIX)
app.include_router(polymorphic.router,     prefix=PREFIX)
app.include_router(federated.router,       prefix=PREFIX)
app.include_router(knowtique10x.router,    prefix=PREFIX)
app.include_router(platform_config.router, prefix=PREFIX)
app.include_router(enterprise.router,      prefix=PREFIX)
app.include_router(agent_factory.router,   prefix=PREFIX)
app.include_router(pioneer.router,         prefix=PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


# ── API Key management endpoints (admin bootstrap) ────────────────────────────
# These are intentionally NOT behind TenantMiddleware auth (bootstrap scenario).
# In production, secure these behind network-level ACLs or a separate admin service.

from fastapi import HTTPException, Header

@app.post("/admin/api-keys", include_in_schema=False)
async def create_api_key(tenant_id: str, name: str, role: str = "operator", x_admin_secret: str = Header(None)):
    """
    Bootstrap: create an API key for a tenant.
    Call this once per tenant on first deploy.
    Protect this endpoint in production via network ACL or remove after bootstrap.
    """
    admin_secret = getattr(settings, "ADMIN_SECRET", "dev_secret")
    if x_admin_secret != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    from app.core.auth import generate_api_key
    key_data = generate_api_key(tenant_id=tenant_id, name=name, role=role)
    logger.info(f"[Admin] API key created for tenant={tenant_id} role={role}")
    return key_data


@app.delete("/admin/api-keys/{key_prefix}", include_in_schema=False)
async def revoke_api_key(key_prefix: str, x_admin_secret: str = Header(None)):
    """Revoke an API key by its first 12 characters."""
    admin_secret = getattr(settings, "ADMIN_SECRET", "dev_secret")
    if x_admin_secret != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    from app.core.auth import revoke_api_key as _revoke
    revoked = _revoke(key_prefix)
    if not revoked:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"status": "revoked", "key_prefix": key_prefix}
