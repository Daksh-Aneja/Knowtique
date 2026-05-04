"""Knowtique 10X — Federated Operations API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.federated_engine import FederatedEngine

router = APIRouter(prefix="/federated", tags=["Knowtique 10X — Federated Engine"])

@router.post("/export-skill/{skill_id}")
async def export_skill_to_swarm(skill_id: str, db: AsyncSession = Depends(get_db)):
    """
    Exports a local skill's procedural weights to the Global Swarm 
    using Zero-Knowledge abstraction.
    """
    try:
        ledger_receipt = await FederatedEngine.export_skill_to_swarm(db, skill_id)
        return {
            "status": "EXPORTED",
            "skill_id": skill_id,
            "ledger_receipt": ledger_receipt,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
