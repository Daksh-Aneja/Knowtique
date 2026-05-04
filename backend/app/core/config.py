"""Knowtique Backend — Core Configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Knowtique"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    SECRET_KEY: str = ""  # REQUIRED: set in .env — python -c "import secrets; print(secrets.token_urlsafe(32))"

    # Database — SQLite for local dev, PostgreSQL for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./knowtique.db"
    DATABASE_URL_SYNC: str = "sqlite:///./knowtique.db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    SKILLS_CACHE_TTL: int = 300

    # Neo4j (Graph Store)
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""

    # Kafka (Data Fabric L0)
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_SCHEMA_REGISTRY_URL: str = "http://localhost:8081"

    # LLM Configuration — 4-tier routing
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_MODEL_CLASSIFICATION: str = "claude-haiku-4-20250414"
    LLM_MODEL_EXTRACTION: str = "claude-sonnet-4-20250514"
    LLM_MODEL_REASONING: str = "claude-opus-4-20250514"
    LLM_CACHE_ENABLED: bool = True

    # Confidence Thresholds
    CONFIDENCE_AUTO_COMMIT: float = 0.85
    CONFIDENCE_VALIDATION: float = 0.60
    CONFIDENCE_AUTONOMOUS_EXEC: float = 0.82
    CONFIDENCE_SPECULATIVE_MAX: float = 0.29
    CONFIDENCE_INFERRED_MAX: float = 0.59
    CONFIDENCE_VALIDATED_PEER_MAX: float = 0.74
    CONFIDENCE_VALIDATED_DH_MAX: float = 0.84

    # Elicitation
    MAX_QUESTIONS_PER_WEEK: int = 3
    QUESTION_MIN_QUALITY: float = 0.7

    # Agent Runtime
    AGENT_SANDBOX_MEMORY_MB: int = 512
    AGENT_SANDBOX_TIMEOUT_SEC: int = 300
    AGENT_MAX_REFUNDS_PER_HOUR: int = 50

    # Decay
    DECAY_CHECK_INTERVAL_HOURS: int = 1

    # Slack
    SLACK_BOT_TOKEN: str = ""
    SLACK_SIGNING_SECRET: str = ""

    # Temporal
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "knowtique"

    # TimescaleDB
    TIMESCALE_URL: str = ""  # Set in .env if using TimescaleDB

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    return Settings()
