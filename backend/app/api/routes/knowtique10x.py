"""Knowtique 10X — Regulatory & Quantum APIs"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.services.regulatory_engine import RegulatoryEngine, RegulatoryUpdate
from app.services.quantum_ledger import QuantumLedgerEngine

router = APIRouter(prefix="/10x", tags=["Knowtique 10X — Advanced Capabilities"])

class RegulationPayload(BaseModel):
    framework_name: str
    directive_text: str
    urgency: str

@router.post("/ingest-regulation")
async def ingest_regulation(payload: RegulationPayload, db: AsyncSession = Depends(get_db)):
    """
    Ingests a new legal framework and autonomously generates compliance rules.
    """
    try:
        update = RegulatoryUpdate(
            framework_name=payload.framework_name,
            directive_text=payload.directive_text,
            urgency=payload.urgency
        )
        result = await RegulatoryEngine.ingest_new_regulation(db, update)
        
        # Also log this massive event in the Quantum Ledger
        await QuantumLedgerEngine.record_quantum_event(
            db=db,
            event_type="REGULATORY_AUTO_PATCH",
            actor="SYSTEM_L24",
            reasoning=f"Autonomously ingested and complied with {update.framework_name}",
            payload=result
        )
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from sqlalchemy import select
from app.models.domain import ProvenanceLedger, Rule, Skill

@router.get("/quantum-events")
async def get_quantum_events(db: AsyncSession = Depends(get_db)):
    """Fetch all post-quantum secured ledger events."""
    q = await db.execute(select(ProvenanceLedger).filter(ProvenanceLedger.event_type.like("PQ_%")).order_by(ProvenanceLedger.timestamp.desc()))
    events = q.scalars().all()
    return [{"id": e.id, "event_type": e.event_type, "timestamp": e.timestamp, "reasoning": e.reasoning, "chain_hash": e.chain_hash} for e in events]

@router.get("/regulatory-rules")
async def get_regulatory_rules(db: AsyncSession = Depends(get_db)):
    """Fetch all automatically synthesized regulatory rules."""
    q = await db.execute(select(Rule).filter(Rule.workflow_id == "wf_compliance_auto"))
    rules = q.scalars().all()
    return [{"id": r.id, "statement": r.statement, "compliance_tags": r.compliance_tags, "domain": r.domain, "created_at": r.created_at} for r in rules]

@router.get("/federated-exports")
async def get_federated_exports(db: AsyncSession = Depends(get_db)):
    """Fetch all skills exported to the global swarm."""
    q = await db.execute(select(Skill))
    skills = q.scalars().all()
    exports = []
    for s in skills:
        events = s.guardrails.get("federated_events", [])
        for ev in events:
            exports.append({
                "skill_id": s.skill_id,
                "domain": s.domain,
                "global_id": ev.get("global_id"),
                "procedural_hash": ev.get("procedural_hash"),
                "timestamp": ev.get("timestamp"),
                "success_rate": s.success_rate
            })
    return exports

@router.get("/polymorphic-events")
async def get_polymorphic_events(db: AsyncSession = Depends(get_db)):
    """Fetch all code generation events from the polymorphic engine."""
    q = await db.execute(select(Skill))
    skills = q.scalars().all()
    poly_events = []
    for s in skills:
        events = s.guardrails.get("polymorphic_events", [])
        for ev in events:
            poly_events.append({
                "skill_id": s.skill_id,
                "tool": ev.get("tool"),
                "event_type": ev.get("event"),
                "timestamp": ev.get("timestamp")
            })
    return poly_events
