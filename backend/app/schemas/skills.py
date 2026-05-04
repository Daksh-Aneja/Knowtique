"""Knowtique — Pydantic Schemas: Skills"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SkillSummary(BaseModel):
    id: str
    skill_id: str
    department: str
    domain: str
    version: str
    status: str
    confidence: float
    confidence_tier: str
    execution_count: int
    success_rate: float
    half_life_days: int
    expires_at: Optional[datetime] = None
    last_validated: Optional[datetime] = None
    mcp_tool_bindings: List[str] = []
    compliance_tags: List[str] = []
    access_level: str = "department"

    class Config:
        from_attributes = True


class SkillDetail(SkillSummary):
    confidence_vector: Dict[str, float] = {}
    triggers: List[Any] = []
    steps: List[Any] = []
    exceptions: List[Any] = []
    guardrails: Dict[str, Any] = {}
    confidence_notes: List[str] = []
    provenance: Dict[str, Any] = {}
    compiled_at: Optional[datetime] = None


class SkillRegistryResponse(BaseModel):
    total: int
    total_executions: int
    avg_success_rate: float
    skills: List[SkillSummary]


class SkillExecutionRequest(BaseModel):
    intent: str
    context: Dict[str, Any] = {}


class SkillExecutionResponse(BaseModel):
    execution_id: str
    skill_id: str
    status: str
    route_type: str
    reasoning_chain: List[Dict[str, Any]] = []
    duration_ms: int = 0
    hitl_required: bool = False
