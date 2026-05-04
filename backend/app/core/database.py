"""Knowtique — Database Engine & Session Factory"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.domain import Base
# Import all model modules to register their tables with Base.metadata
# Wrapped in try/except so a broken subsystem doesn't crash the entire DB init
import logging as _logging
_db_logger = _logging.getLogger(__name__)

_model_modules = [
    "app.models.settings",
    "app.models.agent_factory",
    "app.models.fairness",
    "app.models.calendar",
]
for _mod in _model_modules:
    try:
        __import__(_mod)
    except Exception as _exc:
        _db_logger.warning(f"[Database] Could not import {_mod}: {_exc}. Tables from this module will not be created.")

settings = get_settings()

# SQLite doesn't support pool_size/max_overflow
engine_kwargs = {
    "echo": settings.DEBUG,
}
if not settings.is_sqlite:
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db():
    """Create all tables (for dev/demo — use Alembic in production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
