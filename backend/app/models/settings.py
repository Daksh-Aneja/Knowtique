"""Knowtique — Platform Settings Models"""
from sqlalchemy import Column, String, Boolean, Integer, Float, JSON, DateTime
from sqlalchemy.sql import func
import uuid

from app.models.domain import Base

def _uuid():
    return str(uuid.uuid4())

class LLMRoutingConfig(Base):
    __tablename__ = 'config_llm_routing'
    id = Column(String, primary_key=True, default=_uuid)
    tenant_id = Column(String, nullable=False, index=True)
    layer = Column(String(32), unique=True, nullable=False) # e.g., TIER_1_COMPLEX, TIER_2_STANDARD, TIER_3_FAST
    model_name = Column(String(64), nullable=False)
    api_key = Column(String, nullable=False) # Stored securely
    provider = Column(String(32), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MCPToolConfig(Base):
    __tablename__ = 'config_mcp_tools'
    id = Column(String, primary_key=True, default=_uuid)
    tenant_id = Column(String, nullable=False, index=True)
    tool_id = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    rate_limit_per_hour = Column(Integer, default=1000)
    api_key = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OntologyConfig(Base):
    __tablename__ = 'config_ontology'
    id = Column(String, primary_key=True, default=_uuid)
    tenant_id = Column(String, nullable=False, index=True)
    department = Column(String, unique=True, nullable=False)
    default_half_life_days = Column(Integer, default=90)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class FederatedConfig(Base):
    __tablename__ = 'config_federated'
    id = Column(String, primary_key=True, default=_uuid)
    tenant_id = Column(String, nullable=False, index=True)
    department = Column(String, unique=True, nullable=False)
    opt_in = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
