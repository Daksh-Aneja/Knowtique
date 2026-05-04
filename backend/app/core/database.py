"""Knowtique — Database Engine & Session Factory"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.domain import Base
# Import all model modules to register their tables with Base.metadata
import app.models.settings  # noqa: F401
import app.models.agent_factory  # noqa: F401 — AEOS Agent Factory models
import app.models.fairness  # noqa: F401 — AEOS P3 Ethical AI models
import app.models.calendar  # noqa: F401 — AEOS P4 Temporal Calendar models

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
