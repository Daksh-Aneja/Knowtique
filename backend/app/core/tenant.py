"""
Knowtique — Tenant Resolution Middleware + FastAPI Dependency
Replaces the hardcoded TENANT = "default" across all 15+ route files.

HOW IT WORKS
─────────────
1. TenantMiddleware (Starlette BaseHTTPMiddleware) runs on every request.
   It reads the Authorization: Bearer <kt_xxx> header, resolves the tenant
   via the existing _API_KEYS store in auth.py, and writes the tenant context
   to request.state.tenant.

2. get_tenant() is a FastAPI Depends() function that reads request.state.tenant.
   Any route that previously used TENANT = "default" should inject:
       tenant: dict = Depends(get_tenant)
   and reference tenant["tenant_id"] instead.

3. get_tenant_id() is a convenience shortcut that returns just the string ID.

MIGRATION GUIDE (per route file)
──────────────────────────────────
BEFORE (agent_factory.py, rules.py, etc.):
    TENANT = "default"
    ...
    @router.get("/agents/blueprints")
    async def list_blueprints():
        ...where(AgentBlueprint.tenant_id == TENANT)...

AFTER:
    from app.core.tenant import get_tenant_id
    ...
    @router.get("/agents/blueprints")
    async def list_blueprints(tenant_id: str = Depends(get_tenant_id)):
        ...where(AgentBlueprint.tenant_id == tenant_id)...

MAIN.PY CHANGE
───────────────
Add before the router registrations:
    from app.core.tenant import TenantMiddleware
    app.add_middleware(TenantMiddleware)
"""
import logging
from typing import Optional

from fastapi import Depends, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Dev-mode default — used when no API keys are registered (local development)
_DEV_TENANT = {
    "tenant_id": "tenant_acme",
    "role": "admin",
    "name": "dev_user",
}

# Role hierarchy — used by require_role() dependency
ROLE_HIERARCHY = {"viewer": 0, "operator": 1, "admin": 2}


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that resolves the tenant for every request.

    Flow:
      1. No Authorization header  → dev mode tenant (if _API_KEYS is empty)
                                  → 401 if _API_KEYS is populated (production)
      2. Authorization: Bearer <key>  → hash key → lookup in _API_KEYS
                                      → 401 if not found / inactive
      3. On success: writes tenant context to request.state.tenant

    The middleware never raises exceptions directly — it returns JSON 401/403
    responses so FastAPI's exception handlers process them correctly.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Health checks and docs don't need tenant resolution
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            request.state.tenant = _DEV_TENANT
            return await call_next(request)

        from app.core.auth import _API_KEYS, hash_key

        # Dev bypass — no keys registered means local development
        if not _API_KEYS:
            request.state.tenant = _DEV_TENANT
            logger.debug("[Tenant] Dev bypass — no API keys registered")
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.warning(f"[Tenant] Missing bearer token: {request.url.path}")
            return _unauthorized("Missing Authorization: Bearer <api_key> header")

        raw_key = auth_header.removeprefix("Bearer ").strip()

        # Guard against obviously malformed keys
        if not raw_key.startswith("kt_") or len(raw_key) < 20:
            return _unauthorized("Invalid API key format")

        hashed = hash_key(raw_key)
        key_meta = _API_KEYS.get(hashed)

        if not key_meta:
            logger.warning(f"[Tenant] Unknown API key presented: {raw_key[:12]}…")
            return _unauthorized("API key not recognised")

        if not key_meta.get("active", True):
            logger.warning(f"[Tenant] Revoked key used: {raw_key[:12]}…")
            return _unauthorized("API key has been revoked")

        request.state.tenant = {
            "tenant_id": key_meta["tenant_id"],
            "role": key_meta.get("role", "operator"),
            "name": key_meta.get("name", "unknown"),
        }

        logger.debug(
            f"[Tenant] Resolved: tenant_id={key_meta['tenant_id']} "
            f"role={key_meta.get('role')} path={request.url.path}"
        )

        return await call_next(request)


# ── FastAPI dependency functions ─────────────────────────────────────────────

def get_tenant(request: Request) -> dict:
    """
    FastAPI Depends() — returns the full tenant context dict.

    Usage:
        @router.get("/something")
        async def handler(tenant: dict = Depends(get_tenant)):
            tenant_id = tenant["tenant_id"]
            role = tenant["role"]
    """
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        # Middleware should have set this — if missing, it's a config error
        raise HTTPException(
            status_code=500,
            detail="Tenant context not resolved. Ensure TenantMiddleware is registered.",
        )
    return tenant


def get_tenant_id(tenant: dict = Depends(get_tenant)) -> str:
    """
    FastAPI Depends() — returns just the tenant_id string.

    Usage (replaces TENANT = "default"):
        @router.get("/agents/blueprints")
        async def list_blueprints(tenant_id: str = Depends(get_tenant_id)):
            ...where(AgentBlueprint.tenant_id == tenant_id)...
    """
    return tenant["tenant_id"]


def require_role(required_role: str):
    """
    FastAPI Depends() factory — gates a route behind a minimum role.

    Roles in order of privilege: viewer < operator < admin
    Usage:
        @router.post("/agents/blueprint/{id}/deploy")
        async def deploy(
            tenant: dict = Depends(require_role("admin")),
        ):
            ...

    Returns the full tenant dict so the route can still use tenant_id.
    """
    def _checker(tenant: dict = Depends(get_tenant)) -> dict:
        caller_level = ROLE_HIERARCHY.get(tenant.get("role", "viewer"), 0)
        required_level = ROLE_HIERARCHY.get(required_role, 99)
        if caller_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{required_role}' required. Caller has '{tenant.get('role')}'.",
            )
        return tenant

    return _checker


# ── Internal helpers ─────────────────────────────────────────────────────────

def _unauthorized(detail: str) -> Response:
    import json
    from starlette.responses import JSONResponse
    return JSONResponse(
        status_code=401,
        content={"detail": detail},
        headers={"WWW-Authenticate": "Bearer"},
    )
