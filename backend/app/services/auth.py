"""
KAEOS — Authentication Service
JWT token management, password hashing, user CRUD with RBAC enforcement.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib
import secrets
import json
import base64

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User, UserRole

logger = logging.getLogger(__name__)

# Simple JWT-like token using HMAC (no external dependency needed)
SECRET_KEY = "kaeos-jwt-secret-change-in-production-2026"
TOKEN_EXPIRY_HOURS = 24


def _hash_password(password: str) -> str:
    """Hash password with SHA-256 + salt."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{hashed}"


def _verify_password(password: str, hashed: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, stored_hash = hashed.split(":")
        computed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
        return computed == stored_hash
    except (ValueError, AttributeError):
        return False


def _create_token(user_id: str, email: str, role: str, tenant_id: str) -> str:
    """Create a simple signed token (base64 encoded JSON + HMAC signature)."""
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "exp": (datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)).isoformat(),
        "iat": datetime.now(timezone.utc).isoformat(),
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    signature = hashlib.sha256(f"{payload_b64}{SECRET_KEY}".encode()).hexdigest()[:32]
    return f"{payload_b64}.{signature}"


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a token. Returns payload or None."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hashlib.sha256(f"{payload_b64}{SECRET_KEY}".encode()).hexdigest()[:32]
        if signature != expected_sig:
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        # Check expiry
        exp = datetime.fromisoformat(payload["exp"])
        if datetime.now(timezone.utc) > exp:
            return None
        return payload
    except Exception:
        return None


class AuthService:
    """Authentication and user management service."""

    @staticmethod
    async def seed_demo_user(db: AsyncSession):
        """Create the default demo admin account if it doesn't exist."""
        result = await db.execute(
            select(User).where(User.email == "demo@kaeos.ai")
        )
        existing = result.scalar_one_or_none()
        if existing:
            return

        demo = User(
            email="demo@kaeos.ai",
            display_name="Demo Admin",
            hashed_password=_hash_password("demo123"),
            role=UserRole.ADMIN,
            tenant_id="default",
            is_active=True,
            is_demo=True,
        )
        db.add(demo)
        await db.commit()
        logger.info("[Auth] Demo admin account created: demo@kaeos.ai / demo123")

    @staticmethod
    async def login(db: AsyncSession, email: str, password: str) -> Optional[dict]:
        """Authenticate user and return JWT token."""
        result = await db.execute(
            select(User).where(User.email == email, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        if not user or not _verify_password(password, user.hashed_password):
            return None

        # Update login tracking
        user.login_count = (user.login_count or 0) + 1
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()

        token = _create_token(user.id, user.email, user.role.value, user.tenant_id)
        return {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "role": user.role.value,
                "tenant_id": user.tenant_id,
                "is_demo": user.is_demo,
            }
        }

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[dict]:
        """Get user profile by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role.value,
            "tenant_id": user.tenant_id,
            "is_active": user.is_active,
            "is_demo": user.is_demo,
            "login_count": user.login_count,
            "last_login_at": str(user.last_login_at) if user.last_login_at else None,
            "created_at": str(user.created_at) if user.created_at else None,
        }

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        display_name: str,
        password: str,
        role: UserRole,
        created_by: str,
        tenant_id: str = "default"
    ) -> dict:
        """Create a new user (ADMIN only)."""
        # Check if email exists
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            return {"error": "email_already_exists"}

        user = User(
            email=email,
            display_name=display_name,
            hashed_password=_hash_password(password),
            role=role,
            tenant_id=tenant_id,
            created_by=created_by,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"[Auth] User created: {email} (role={role.value}) by {created_by}")
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role.value,
        }

    @staticmethod
    async def list_users(db: AsyncSession, tenant_id: str = "default") -> list:
        """List all users for a tenant."""
        result = await db.execute(
            select(User).where(User.tenant_id == tenant_id)
            .order_by(User.created_at.desc())
        )
        users = result.scalars().all()
        return [{
            "id": u.id,
            "email": u.email,
            "display_name": u.display_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "is_demo": u.is_demo,
            "login_count": u.login_count,
            "last_login_at": str(u.last_login_at) if u.last_login_at else None,
            "created_at": str(u.created_at) if u.created_at else None,
        } for u in users]

    @staticmethod
    async def update_user_role(db: AsyncSession, user_id: str, new_role: UserRole) -> dict:
        """Update a user's role."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "user_not_found"}
        user.role = new_role
        await db.commit()
        return {"id": user.id, "role": new_role.value}

    @staticmethod
    async def deactivate_user(db: AsyncSession, user_id: str) -> dict:
        """Deactivate a user account."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "user_not_found"}
        if user.is_demo:
            return {"error": "cannot_deactivate_demo"}
        user.is_active = False
        await db.commit()
        return {"id": user.id, "is_active": False}
