from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.domain import Signal, Rule
from app.services.extraction import ContradictionDetector, RuleMiner
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/extraction", tags=["Extraction — L2 Knowledge Extraction"])

class CandidateRule(BaseModel):
    statement: str
    trigger_json: dict
    action_json: dict
    domain: str
    confidence_basis: str

@router.get("/signals")
async def get_raw_signals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Signal).order_by(Signal.created_at.desc()).limit(50))
    return {"signals": result.scalars().all()}

@router.get("/candidates")
async def get_candidate_rules(db: AsyncSession = Depends(get_db)):
    # Group signals by domain
    signals = await db.execute(select(Signal))
    signal_list = signals.scalars().all()
    
    miner = RuleMiner()
    candidates = []
    domains = set(s.domain for s in signal_list if s.domain)
    
    for dom in domains:
        cluster = [s for s in signal_list if s.domain == dom]
        if len(cluster) >= 3:
            rule_dict = await miner.extract_rule([{"id": s.id, "payload": s.clean_payload} for s in cluster])
            if rule_dict:
                rule_dict["domain"] = dom
                rule_dict["id"] = f"cand_{dom}_{len(candidates)}"
                candidates.append(rule_dict)
                
    return {"candidates": candidates}

@router.post("/detect-conflict")
async def detect_conflict(candidate: CandidateRule, db: AsyncSession = Depends(get_db)):
    detector = ContradictionDetector()
    existing_rules = await db.execute(select(Rule).where(Rule.domain == candidate.domain))
    kb_list = [{"id": r.id, "domain": r.domain, "trigger_json": r.trigger_json, "action_json": r.action_json} for r in existing_rules.scalars().all()]
    
    result = await detector.detect(candidate.model_dump(), kb_list)
    return result
