"""
KAEOS S1 — Infrastructure Layer API Routes
N1: Model Management, N2: Cost Governor, N3: Agent Protocol, N4: Onboarding
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_tenant_id
from app.services.model_management import ModelManagementService
from app.services.cost_governor import CostGovernorService
from app.services.agent_protocol import AgentProtocolService
from app.services.onboarding_engine import OnboardingEngineService

router = APIRouter(tags=["Infrastructure (S1)"])


# ── N1: Model Management ─────────────────────────────────────────────────────

@router.get("/infrastructure/models")
async def list_models(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N1 — List all registered LLM models with performance benchmarks."""
    return await ModelManagementService.get_registry(db, tenant_id)


@router.post("/infrastructure/models")
async def register_model(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N1 — Register a new model in the 4-tier catalog."""
    from app.models.infrastructure import ModelTier
    tier_map = {"FAST": ModelTier.FAST, "STANDARD": ModelTier.STANDARD,
                "DEEP": ModelTier.DEEP, "VERTICAL": ModelTier.VERTICAL}
    return await ModelManagementService.register_model(
        db, tenant_id,
        model_name=data.get("model_name", ""),
        provider=data.get("provider", "anthropic"),
        tier=tier_map.get(data.get("tier", "STANDARD"), ModelTier.STANDARD),
        cost_per_1k_input=data.get("cost_per_1k_input", 0.0),
        cost_per_1k_output=data.get("cost_per_1k_output", 0.0),
        max_context_window=data.get("max_context_window", 200000),
        use_cases=data.get("use_cases", []),
        is_canary=data.get("is_canary", False)
    )


@router.post("/infrastructure/models/route")
async def route_model(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N1 — Route a request to the best model for the given task type."""
    return await ModelManagementService.route_to_model(
        db, tenant_id,
        request_type=data.get("request_type", ""),
        preferred_tier=None
    )


@router.get("/infrastructure/prompts")
async def list_prompts(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N1 — List all active prompt templates."""
    return await ModelManagementService.list_prompts(db, tenant_id)


@router.post("/infrastructure/prompts")
async def register_prompt(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N1 — Register a versioned prompt template."""
    return await ModelManagementService.register_prompt(
        db, tenant_id,
        template_key=data.get("template_key", ""),
        system_prompt=data.get("system_prompt", ""),
        user_template=data.get("user_template"),
        max_tokens=data.get("max_tokens", 4096),
        temperature=data.get("temperature", 0.7)
    )


@router.get("/infrastructure/models/estimate")
async def estimate_tokens(request_type: str = Query("extraction")):
    """N1 — Pre-compute expected token usage per workflow type."""
    return await ModelManagementService.estimate_token_budget(request_type)


# ── N2: Cost Governor ─────────────────────────────────────────────────────────

@router.get("/infrastructure/cost/telemetry")
async def get_cost_telemetry(hours: int = Query(24), tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N2 — Real-time cost telemetry: token consumption per model, agent, workflow."""
    return await CostGovernorService.get_cost_telemetry(db, tenant_id, hours)


@router.get("/infrastructure/cost/budgets")
async def list_budgets(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N2 — List all token budget allocations."""
    return await CostGovernorService.get_budgets(db, tenant_id)


@router.post("/infrastructure/cost/budgets")
async def create_budget(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N2 — Create or update a token budget allocation."""
    return await CostGovernorService.create_budget(
        db, tenant_id,
        scope=data.get("scope", "tenant"),
        scope_id=data.get("scope_id"),
        token_limit=data.get("token_limit", 10_000_000),
        cost_limit_usd=data.get("cost_limit_usd", 100.0)
    )


@router.post("/infrastructure/cost/check")
async def check_budget(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N2 — Check if a request is within budget."""
    return await CostGovernorService.check_budget(
        db, tenant_id,
        estimated_tokens=data.get("estimated_tokens", 0),
        scope=data.get("scope", "tenant")
    )


@router.post("/infrastructure/cost/record")
async def record_usage(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N2 — Record token consumption event."""
    return await CostGovernorService.record_usage(
        db, tenant_id,
        model_name=data.get("model_name", ""),
        model_tier=data.get("model_tier", "STANDARD"),
        input_tokens=data.get("input_tokens", 0),
        output_tokens=data.get("output_tokens", 0),
        cost_usd=data.get("cost_usd", 0.0),
        latency_ms=data.get("latency_ms", 0),
        agent_id=data.get("agent_id"),
        request_type=data.get("request_type")
    )


# ── N3: Agent Protocol ────────────────────────────────────────────────────────

@router.get("/infrastructure/agents/registry")
async def list_agent_registry(tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — List all registered agents with capabilities and health status."""
    return await AgentProtocolService.list_agents(db, tenant_id)


@router.post("/infrastructure/agents/register")
async def register_agent(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — Register an agent in the discovery registry."""
    return await AgentProtocolService.register_agent(
        db, tenant_id,
        agent_name=data.get("agent_name", ""),
        agent_type=data.get("agent_type", "base"),
        capabilities=data.get("capabilities", []),
        max_concurrent=data.get("max_concurrent", 10)
    )


@router.post("/infrastructure/agents/discover")
async def discover_agent(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — Find the best available agent for a given capability."""
    result = await AgentProtocolService.discover_agent(
        db, tenant_id, capability=data.get("capability", "")
    )
    return result or {"error": "no_matching_agent_found"}


@router.post("/infrastructure/agents/message")
async def send_agent_message(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — Send an async message between agents."""
    return await AgentProtocolService.send_message(
        db, tenant_id,
        sender_agent_id=data.get("sender_agent_id", ""),
        receiver_agent_id=data.get("receiver_agent_id", ""),
        message_type=data.get("message_type", "request"),
        payload=data.get("payload", {}),
        context_envelope=data.get("context_envelope"),
        correlation_id=data.get("correlation_id"),
        priority=data.get("priority", 5)
    )


@router.get("/infrastructure/agents/messages")
async def get_messages(
    correlation_id: str = Query(None),
    limit: int = Query(50),
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """N3 — Get message history."""
    return await AgentProtocolService.get_message_history(
        db, tenant_id, correlation_id=correlation_id, limit=limit
    )


@router.post("/infrastructure/agents/{agent_name}/heartbeat")
async def agent_heartbeat(agent_name: str, data: dict = {}, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — Update agent heartbeat and load."""
    await AgentProtocolService.heartbeat(
        db, tenant_id, agent_name, current_load=data.get("current_load", 0)
    )
    return {"status": "ok"}


@router.post("/infrastructure/agents/{agent_name}/circuit/reset")
async def reset_circuit(agent_name: str, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N3 — Reset circuit breaker for an agent."""
    await AgentProtocolService.reset_circuit(db, tenant_id, agent_name)
    return {"status": "circuit_reset", "agent_name": agent_name}


# ── N4: Tenant Onboarding ─────────────────────────────────────────────────────

@router.get("/infrastructure/onboarding")
async def list_onboardings(db: AsyncSession = Depends(get_db)):
    """N4 — List all tenant onboarding records."""
    return await OnboardingEngineService.list_all_onboardings(db)


@router.get("/infrastructure/onboarding/{tenant_id}")
async def get_onboarding(tenant_id: str, db: AsyncSession = Depends(get_db)):
    """N4 — Get onboarding status for a tenant."""
    result = await OnboardingEngineService.get_onboarding_status(db, tenant_id)
    return result or {"error": "not_found"}


@router.post("/infrastructure/onboarding")
async def initiate_onboarding(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N4 — Start onboarding for a new tenant."""
    return await OnboardingEngineService.initiate_onboarding(
        db,
        tenant_id=data.get("tenant_id", tenant_id),
        tenant_name=data.get("tenant_name", "Default Tenant"),
        industry_vertical=data.get("industry_vertical")
    )


@router.post("/infrastructure/onboarding/{tenant_id}/advance")
async def advance_onboarding(tenant_id: str, data: dict = {}, db: AsyncSession = Depends(get_db)):
    """N4 — Advance to next onboarding stage."""
    return await OnboardingEngineService.advance_stage(db, tenant_id, metrics=data.get("metrics"))


@router.post("/infrastructure/schema-mappings/propose")
async def propose_schema_mappings(data: dict, tenant_id: str = Depends(get_tenant_id), db: AsyncSession = Depends(get_db)):
    """N4 — AI-propose schema mappings for source fields."""
    return await OnboardingEngineService.propose_mappings(
        db, tenant_id,
        connector_id=data.get("connector_id", ""),
        source_fields=data.get("source_fields", [])
    )


@router.get("/infrastructure/schema-mappings")
async def get_schema_mappings(
    connector_id: str = Query(None),
    confirmed_only: bool = Query(False),
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db)
):
    """N4 — Get schema mappings for a tenant."""
    return await OnboardingEngineService.get_mappings(
        db, tenant_id, connector_id=connector_id, confirmed_only=confirmed_only
    )


@router.post("/infrastructure/schema-mappings/{mapping_id}/confirm")
async def confirm_mapping(mapping_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """N4 — Admin confirms or corrects a schema mapping."""
    return await OnboardingEngineService.confirm_mapping(
        db, mapping_id,
        confirmed_by=data.get("confirmed_by", "admin"),
        target_entity=data.get("target_entity"),
        target_field=data.get("target_field")
    )
