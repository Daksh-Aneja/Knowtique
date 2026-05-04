from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List

from app.core.database import get_db
from app.models.settings import LLMRoutingConfig, MCPToolConfig, OntologyConfig, FederatedConfig

router = APIRouter(prefix="/config", tags=["Platform Config"])

# -- LLM Routing & BYOK --
class LLMConfigItem(BaseModel):
    id: str | None = None
    layer: str
    model_name: str
    api_key: str
    provider: str

@router.get("/llm-routing", response_model=List[LLMConfigItem])
async def get_llm_routing(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LLMRoutingConfig))
    return res.scalars().all()

@router.post("/llm-routing", response_model=LLMConfigItem)
async def update_llm_routing(item: LLMConfigItem, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LLMRoutingConfig).where(LLMRoutingConfig.layer == item.layer))
    db_item = res.scalar_one_or_none()
    if db_item:
        db_item.model_name = item.model_name
        db_item.api_key = item.api_key
        db_item.provider = item.provider
    else:
        db_item = LLMRoutingConfig(
            tenant_id="default",
            layer=item.layer,
            model_name=item.model_name,
            api_key=item.api_key,
            provider=item.provider
        )
        db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

# -- MCP Tools --
class MCPToolItem(BaseModel):
    id: str | None = None
    tool_id: str
    is_active: bool
    rate_limit_per_hour: int
    api_key: str | None = None

@router.get("/mcp-tools", response_model=List[MCPToolItem])
async def get_mcp_tools(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MCPToolConfig))
    return res.scalars().all()

@router.post("/mcp-tools", response_model=MCPToolItem)
async def update_mcp_tool(item: MCPToolItem, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(MCPToolConfig).where(MCPToolConfig.tool_id == item.tool_id))
    db_item = res.scalar_one_or_none()
    if db_item:
        db_item.is_active = item.is_active
        db_item.rate_limit_per_hour = item.rate_limit_per_hour
        db_item.api_key = item.api_key
    else:
        db_item = MCPToolConfig(
            tenant_id="default",
            tool_id=item.tool_id,
            is_active=item.is_active,
            rate_limit_per_hour=item.rate_limit_per_hour,
            api_key=item.api_key
        )
        db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

# -- Ontology --
class OntologyItem(BaseModel):
    id: str | None = None
    department: str
    default_half_life_days: int

@router.get("/ontology", response_model=List[OntologyItem])
async def get_ontology(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(OntologyConfig))
    return res.scalars().all()

@router.post("/ontology", response_model=OntologyItem)
async def update_ontology(item: OntologyItem, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(OntologyConfig).where(OntologyConfig.department == item.department))
    db_item = res.scalar_one_or_none()
    if db_item:
        db_item.default_half_life_days = item.default_half_life_days
    else:
        db_item = OntologyConfig(
            tenant_id="default",
            department=item.department,
            default_half_life_days=item.default_half_life_days
        )
        db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

# -- Federated --
class FederatedItem(BaseModel):
    id: str | None = None
    department: str
    opt_in: bool

@router.get("/federated", response_model=List[FederatedItem])
async def get_federated(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(FederatedConfig))
    return res.scalars().all()

@router.post("/federated", response_model=FederatedItem)
async def update_federated(item: FederatedItem, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(FederatedConfig).where(FederatedConfig.department == item.department))
    db_item = res.scalar_one_or_none()
    if db_item:
        db_item.opt_in = item.opt_in
    else:
        db_item = FederatedConfig(
            tenant_id="default",
            department=item.department,
            opt_in=item.opt_in
        )
        db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item
