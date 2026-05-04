"""Knowtique — Enterprise Connectors API (L0 Data Fabric Connector Mesh)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.domain import Connector

router = APIRouter(prefix="/connectors", tags=["Connectors — L0 Data Fabric"])


@router.get("")
async def list_connectors(
    category: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all enterprise integration connectors with optional filtering."""
    q = select(Connector)
    if category:
        q = q.where(Connector.category == category)
    if status:
        q = q.where(Connector.status == status)
    q = q.order_by(Connector.events_ingested.desc())

    result = await db.execute(q)
    connectors = result.scalars().all()

    total_events = sum(c.events_ingested for c in connectors)
    total_signals = sum(c.signals_extracted for c in connectors)
    connected_count = sum(1 for c in connectors if c.status == "CONNECTED")

    return {
        "connectors": [
            {
                "id": c.id,
                "name": c.name,
                "category": c.category,
                "connector_type": c.connector_type,
                "status": c.status,
                "icon": c.icon,
                "description": c.description,
                "auth_method": c.auth_method,
                "sync_frequency": c.sync_frequency,
                "last_sync_at": c.last_sync_at.isoformat() if c.last_sync_at else None,
                "events_ingested": c.events_ingested,
                "signals_extracted": c.signals_extracted,
                "error_count": c.error_count,
                "avg_latency_ms": c.avg_latency_ms,
                "pii_scrub_enabled": c.pii_scrub_enabled,
                "pii_entities_found": c.pii_entities_found,
                "connected_at": c.connected_at.isoformat() if c.connected_at else None,
            }
            for c in connectors
        ],
        "stats": {
            "total": len(connectors),
            "connected": connected_count,
            "available": len(connectors) - connected_count,
            "total_events_ingested": total_events,
            "total_signals_extracted": total_signals,
        },
    }


@router.post("/{connector_id}/connect")
async def connect_connector(connector_id: str, db: AsyncSession = Depends(get_db)):
    """Connect/activate an enterprise integration."""
    result = await db.execute(select(Connector).where(Connector.id == connector_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connector not found")

    conn.status = "CONNECTED"
    conn.connected_at = datetime.now(timezone.utc)
    conn.last_sync_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "CONNECTED", "connector": conn.name}


@router.post("/{connector_id}/disconnect")
async def disconnect_connector(connector_id: str, db: AsyncSession = Depends(get_db)):
    """Pause/disconnect an enterprise integration."""
    result = await db.execute(select(Connector).where(Connector.id == connector_id))
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(404, "Connector not found")

    conn.status = "PAUSED"
    await db.commit()
    return {"status": "PAUSED", "connector": conn.name}
