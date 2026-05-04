"""Knowtique — Authentication & API Key Middleware (L17 Security Fabric)"""
import logging

logger = logging.getLogger(__name__)
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import hashlib
import uuid

from app.core.database import get_db
from app.models.domain import SecurityAuditLog

# In-memory API key store (production: migrate to DB table)
# Format: { hashed_key: { tenant_id, role, name, created_at, rate_limit } }
_API_KEYS = {}

security = HTTPBearer(auto_error=False)


def hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def generate_api_key(tenant_id: str, name: str, role: str = "operator") -> dict:
    """Generate a new API key for a tenant."""
    raw_key = f"kt_{uuid.uuid4().hex}"
    hashed = hash_key(raw_key)
    _API_KEYS[hashed] = {
        "tenant_id": tenant_id,
        "name": name,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rate_limit": 1000,  # requests/hour
        "active": True,
    }
    return {"api_key": raw_key, "key_id": hashed[:12], "tenant_id": tenant_id, "role": role}


def revoke_api_key(key_id_prefix: str) -> bool:
    """Revoke an API key by its prefix."""
    for hashed, meta in _API_KEYS.items():
        if hashed.startswith(key_id_prefix):
            meta["active"] = False
            return True
    return False


async def get_current_tenant(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Extracts tenant context from API key.
    In dev mode (no keys registered), returns a default tenant.
    """
    # Dev mode bypass — if no keys registered, allow all traffic
    if not _API_KEYS:
        return {
            "tenant_id": "tenant_acme",
            "role": "admin",
            "name": "dev_mode",
            "authenticated": False,
        }

    if not credentials:
        raise HTTPException(401, "Missing API key. Use Authorization: Bearer kt_...")

    hashed = hash_key(credentials.credentials)
    key_meta = _API_KEYS.get(hashed)

    if not key_meta:
        raise HTTPException(401, "Invalid API key")
    if not key_meta.get("active", True):
        raise HTTPException(403, "API key has been revoked")

    return {
        "tenant_id": key_meta["tenant_id"],
        "role": key_meta["role"],
        "name": key_meta["name"],
        "authenticated": True,
    }


# Seed a default dev key on import
_dev_key = generate_api_key("tenant_acme", "dev_default", "admin")
logger.info(f"[AUTH] Dev API Key: {_dev_key['api_key'][:8]}... (truncated)")
