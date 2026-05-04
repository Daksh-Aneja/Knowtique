"""AEOS Pioneer Layer API Routes
P1 External Intelligence + P2 Org Intelligence + L6 Simulation
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.external_intelligence import ExternalIntelligenceEngine
from app.services.org_intelligence import OrgIntelligenceEngine

router = APIRouter(tags=["AEOS Pioneer Layers"])

ext_intel = ExternalIntelligenceEngine()
org_intel = OrgIntelligenceEngine()


# ─── P1: External Intelligence ───

class SignalIngestRequest(BaseModel):
    signal_type: str  # REGULATORY | VENDOR | MARKET | THREAT | ECONOMIC
    source: str
    title: str
    content: str
    severity: str = "MEDIUM"

class CorrelateRequest(BaseModel):
    signal_content: str


@router.post("/intelligence/signals")
async def ingest_signal(req: SignalIngestRequest):
    """P1 — Ingest an external signal (regulatory, vendor, market, threat)."""
    if req.signal_type not in ext_intel.SIGNAL_TYPES:
        raise HTTPException(400, f"Invalid signal_type. Must be one of: {ext_intel.SIGNAL_TYPES}")
    return await ext_intel.ingest_signal(
        req.signal_type, req.source, req.title, req.content, req.severity
    )

@router.post("/intelligence/correlate")
async def correlate_signal(req: CorrelateRequest):
    """P1 — Correlate an external signal with the Company Brain."""
    return await ext_intel.correlate_with_brain(req.signal_content)

@router.post("/intelligence/proactive-alert")
async def generate_proactive_alert(req: SignalIngestRequest):
    """P1 — Generate proactive alert from external signal."""
    return await ext_intel.generate_proactive_alert(req.signal_type, req.content)


# ─── P2: Org Intelligence ───

class ChangeReadinessRequest(BaseModel):
    department: str
    change_description: str

class InfluencePathRequest(BaseModel):
    target_outcome: str
    department: str


@router.post("/org-intelligence/change-readiness")
async def score_change_readiness(req: ChangeReadinessRequest):
    """P2 — Score change readiness for a department."""
    return await org_intel.score_change_readiness(req.department, req.change_description)

@router.post("/org-intelligence/influence-path")
async def map_influence_path(req: InfluencePathRequest):
    """P2 — Plan optimal stakeholder engagement path."""
    return await org_intel.map_influence_path(req.target_outcome, req.department)

@router.get("/org-intelligence/skills-topology")
async def get_skills_topology():
    """P2 — Get skills topology map across departments."""
    return await org_intel.get_skills_topology()


# ─── L6: Simulation ───

class SimulationRequest(BaseModel):
    change_description: str
    target_domain: str
    risk_tolerance: str = "MEDIUM"  # LOW | MEDIUM | HIGH


@router.post("/simulation/what-if")
async def run_simulation(req: SimulationRequest):
    """L6 — What-if simulation before execution."""
    from app.services.llm_router import LLMRouter
    import json

    llm = LLMRouter()
    prompt = (
        f"You are the AEOS Digital Twin Simulation Engine.\n"
        f"Proposed change: {req.change_description}\n"
        f"Target domain: {req.target_domain}\n"
        f"Risk tolerance: {req.risk_tolerance}\n\n"
        f"Simulate the impact of this change. Output JSON:\n"
        f"{{\"simulation_result\": \"SAFE|RISKY|BLOCKED\", "
        f"\"blast_radius\": {{\"affected_rules\": int, \"affected_skills\": int, \"affected_departments\": [\"...\"]}}, "
        f"\"risk_factors\": [{{\"factor\": \"...\", \"severity\": \"HIGH|MEDIUM|LOW\", \"mitigation\": \"...\"}}], "
        f"\"estimated_rollback_time_hours\": int, \"recommendation\": \"...\"}}"
    )

    try:
        res = await llm.complete(prompt=prompt, model_tier="reasoning")
        content = res if isinstance(res, str) else res.get("content", "{}")
        return {"status": "SIMULATED", **json.loads(content)}
    except Exception as e:
        return {"status": "SIMULATION_FAILED", "error": str(e)}
