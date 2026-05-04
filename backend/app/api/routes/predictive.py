"""Knowtique 10X — Predictive Operations API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.domain import Signal, SkillExecution
from app.services.predictive_ops import PredictiveOpsEngine

router = APIRouter(prefix="/predictive", tags=["Knowtique 10X — Predictive Ops"])

@router.post("/analyze-signal/{signal_id}")
async def analyze_and_predict(signal_id: str, db: AsyncSession = Depends(get_db)):
    """
    Analyzes a specific signal for latent intent and triggers 
    a zero-prompt execution if highly confident.
    """
    signal_q = await db.execute(select(Signal).where(Signal.id == signal_id))
    signal = signal_q.scalar_one_or_none()
    
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
        
    intent = await PredictiveOpsEngine.analyze_signal_for_intent(db, signal)
    
    if intent:
        # Trigger execution based on intent
        execution = await PredictiveOpsEngine.trigger_zero_prompt_execution(db, intent)
        return {
            "status": "INTENT_DETECTED",
            "intent": {
                "type": intent.intent_type,
                "confidence": intent.confidence,
                "recommended_skill": intent.recommended_skill_id
            },
            "action": "ZERO_PROMPT_EXECUTION_QUEUED",
            "execution_id": execution.id,
            "hitl_required": execution.hitl_required
        }
        
    return {
        "status": "NO_LATENT_INTENT",
        "message": "Signal processed. No automated action predicted."
    }

@router.get("/ghost-executions")
async def get_ghost_executions(db: AsyncSession = Depends(get_db)):
    """Retrieve all zero-prompt (ghost) executions."""
    exec_q = await db.execute(
        select(SkillExecution)
        .where(SkillExecution.route_type == "ZERO_PROMPT_AUTO")
        .order_by(SkillExecution.started_at.desc())
        .limit(50)
    )
    executions = exec_q.scalars().all()
    
    return {
        "ghost_executions": [
            {
                "id": e.id,
                "skill_name": e.skill_id_name,
                "status": e.status,
                "task_intent": e.task_intent,
                "context": e.context,
                "hitl_required": e.hitl_required,
                "started_at": e.started_at,
            }
            for e in executions
        ]
    }
