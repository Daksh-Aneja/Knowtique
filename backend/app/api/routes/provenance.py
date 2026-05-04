from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.domain import ProvenanceLedger, Rule

router = APIRouter(prefix="/provenance", tags=["Provenance — L11 Lineage Ledger"])

@router.get("/{rule_id}")
async def get_provenance_chain(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProvenanceLedger)
        .where(ProvenanceLedger.rule_id == rule_id)
        .order_by(ProvenanceLedger.timestamp.asc())
    )
    return {"chain": result.scalars().all()}

@router.get("/global/ledger")
async def get_global_ledger(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProvenanceLedger, Rule.statement)
        .outerjoin(Rule, ProvenanceLedger.rule_id == Rule.id)
        .order_by(ProvenanceLedger.timestamp.desc())
        .limit(100)
    )
    
    ledger = []
    for prov, stmt in result.all():
        entry = prov.__dict__.copy()
        entry.pop('_sa_instance_state', None)
        entry["rule_statement"] = stmt or "Unknown Source/Rule"
        ledger.append(entry)
        
    return {"ledger": ledger}


@router.get("/{rule_id}/verify")
async def verify_chain_integrity(rule_id: str, db: AsyncSession = Depends(get_db)):
    """L11 — Verify tamper-evident integrity of the provenance chain for a rule."""
    from app.services.provenance import ProvenanceEngine
    engine = ProvenanceEngine()
    is_valid = await engine.verify_chain_integrity(db, rule_id)
    return {"rule_id": rule_id, "chain_valid": is_valid, "status": "VERIFIED" if is_valid else "TAMPERED"}
