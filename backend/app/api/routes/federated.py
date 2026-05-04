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
        weight = await FederatedEngine.export_skill_to_swarm(db, skill_id)
        return {
            "status": "EXPORTED",
            "global_id": weight.global_id,
            "abstract_domain": weight.abstract_domain,
            "procedural_hash": weight.procedural_hash,
            "success_weight": weight.success_weight
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
