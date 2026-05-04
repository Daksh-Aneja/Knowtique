"""Knowtique — System Health, Webhooks, Search, Bulk Ops, Versioning, Simulation, Reports, Tenants"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc, or_, text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid, json, csv, io

from app.core.database import get_db
from app.models.domain import (
    Rule, Skill, SkillExecution, Signal, Workflow, Employee,
    ElicitationQuestion, Connector, ProvenanceLedger, DecayEvent,
    SecurityAuditLog, RedTeamScanResult, ConflictCase
)

router = APIRouter(tags=["Enterprise Platform"])

# ═══════════════════════════════════════════
# HEALTH & READINESS (K8s)
# ═══════════════════════════════════════════
@router.get("/health")
async def health():
    """Liveness probe — is the process alive?"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/ready")
async def readiness(db: AsyncSession = Depends(get_db)):
    """Readiness probe — can we serve traffic?"""
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except:
        db_ok = False
    return {
        "status": "ready" if db_ok else "not_ready",
        "checks": {"database": db_ok},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/system/stats")
async def system_stats(db: AsyncSession = Depends(get_db)):
    """Full system statistics — entity counts, health metrics."""
    counts = {}
    for model, name in [(Rule, "rules"), (Skill, "skills"), (Signal, "signals"),
                         (Workflow, "workflows"), (Employee, "employees"),
                         (ElicitationQuestion, "questions"), (Connector, "connectors"),
                         (SkillExecution, "executions"), (ProvenanceLedger, "provenance_entries"),
                         (DecayEvent, "decay_events"), (SecurityAuditLog, "audit_logs"),
                         (RedTeamScanResult, "redteam_scans"), (ConflictCase, "conflicts")]:
        r = await db.execute(select(sqlfunc.count(model.id)))
        counts[name] = r.scalar() or 0

    # Avg confidence
    r = await db.execute(select(sqlfunc.avg(Rule.confidence_scalar)).where(Rule.is_archived == False))
    avg_conf = round(r.scalar() or 0, 4)

    # Success rate
    r = await db.execute(select(sqlfunc.avg(Skill.success_rate)))
    avg_success = round(r.scalar() or 0, 4)

    return {"entity_counts": counts, "avg_confidence": avg_conf, "avg_success_rate": avg_success,
            "timestamp": datetime.now(timezone.utc).isoformat()}


# ═══════════════════════════════════════════
# WEBHOOK & EVENT BUS
# ═══════════════════════════════════════════
class WebhookCreate(BaseModel):
    name: str
    endpoint: str
    events: List[str]

@router.post("/webhooks")
async def create_webhook(body: WebhookCreate):
    from app.services.event_bus import event_bus, EventType
    events = []
    for e in body.events:
        try:
            events.append(EventType(e))
        except ValueError:
            raise HTTPException(400, f"Unknown event type: {e}")
    sub = event_bus.subscribe(body.endpoint, events, name=body.name)
    return {"id": sub.id, "name": sub.name, "endpoint": sub.endpoint, "events": body.events}

@router.get("/webhooks")
async def list_webhooks():
    from app.services.event_bus import event_bus
    return {"subscriptions": event_bus.list_subscriptions()}

@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str):
    from app.services.event_bus import event_bus
    ok = event_bus.unsubscribe(webhook_id)
    if not ok:
        raise HTTPException(404, "Webhook not found")
    return {"status": "unsubscribed"}

@router.get("/events/log")
async def event_log(event_type: Optional[str] = None, limit: int = Query(50, le=200)):
    from app.services.event_bus import event_bus
    return {"events": event_bus.get_event_log(event_type, limit)}


# ═══════════════════════════════════════════
# FULL-TEXT SEARCH
# ═══════════════════════════════════════════
@router.get("/search")
async def global_search(q: str = Query(..., min_length=2), db: AsyncSession = Depends(get_db)):
    """Cross-entity full-text search across rules, skills, signals, and questions."""
    pattern = f"%{q}%"
    results = {"rules": [], "skills": [], "signals": [], "questions": []}

    # Rules
    r = await db.execute(select(Rule).where(
        or_(Rule.statement.ilike(pattern), Rule.domain.ilike(pattern))
    ).limit(20))
    results["rules"] = [{"id": x.id, "statement": x.statement, "domain": x.domain,
                          "confidence": x.confidence_scalar, "type": "rule"} for x in r.scalars().all()]

    # Skills
    r = await db.execute(select(Skill).where(
        or_(Skill.skill_id.ilike(pattern), Skill.domain.ilike(pattern), Skill.department.ilike(pattern))
    ).limit(20))
    results["skills"] = [{"id": x.id, "skill_id": x.skill_id, "domain": x.domain,
                           "confidence": x.confidence, "type": "skill"} for x in r.scalars().all()]

    # Signals
    r = await db.execute(select(Signal).where(
        or_(Signal.source_entity.ilike(pattern), Signal.signal_type.ilike(pattern))
    ).limit(20))
    results["signals"] = [{"id": x.id, "source": x.source_entity, "type_": x.signal_type,
                            "domain": x.domain, "type": "signal"} for x in r.scalars().all()]

    # Questions
    r = await db.execute(select(ElicitationQuestion).where(
        ElicitationQuestion.question_text.ilike(pattern)
    ).limit(20))
    results["questions"] = [{"id": x.id, "question": x.question_text,
                              "status": x.status, "type": "question"} for x in r.scalars().all()]

    total = sum(len(v) for v in results.values())
    return {"query": q, "total_results": total, "results": results}


# ═══════════════════════════════════════════
# BULK IMPORT / EXPORT
# ═══════════════════════════════════════════
@router.get("/export/rules")
async def export_rules(format: str = Query("json", pattern="^(json|csv)$"), db: AsyncSession = Depends(get_db)):
    """Export all active rules as JSON or CSV."""
    r = await db.execute(select(Rule).where(Rule.is_archived == False).order_by(Rule.confidence_scalar.desc()))
    rules = r.scalars().all()
    data = [{"id": x.id, "statement": x.statement, "domain": x.domain,
             "confidence_scalar": x.confidence_scalar, "confidence_tier": x.confidence_tier.value if x.confidence_tier else "",
             "workflow_id": x.workflow_id, "is_executable": x.is_executable,
             "compliance_tags": json.dumps(x.compliance_tags or []),
             "half_life_days": x.half_life_days, "created_at": x.created_at.isoformat() if x.created_at else ""}
            for x in rules]

    if format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return {"format": "csv", "count": len(data), "csv": output.getvalue()}
    return {"format": "json", "count": len(data), "rules": data}

@router.get("/export/skills")
async def export_skills(db: AsyncSession = Depends(get_db)):
    """Export all skills as JSON."""
    r = await db.execute(select(Skill))
    skills = r.scalars().all()
    data = [{"skill_id": s.skill_id, "domain": s.domain, "department": s.department,
             "version": s.version, "confidence": s.confidence, "success_rate": s.success_rate,
             "execution_count": s.execution_count, "status": s.status,
             "triggers": s.triggers, "steps": s.steps,
             "mcp_tool_bindings": s.mcp_tool_bindings, "compliance_tags": s.compliance_tags}
            for s in skills]
    return {"count": len(data), "skills": data}

class BulkRuleImport(BaseModel):
    rules: List[dict]

@router.post("/import/rules")
async def import_rules(body: BulkRuleImport, db: AsyncSession = Depends(get_db)):
    """Bulk import rules from JSON array."""
    from app.services.confidence import ConfidenceEngine
    ce = ConfidenceEngine()
    imported = 0
    for rd in body.rules:
        vector = {"source_breadth": 0.3, "source_authority": 0.4, "temporal_freshness": 1.0,
                  "outcome_validation": 0.5, "explicit_validation": 0.0}
        scalar = ce.calculate_scalar(vector)
        rule = Rule(
            id=str(uuid.uuid4()), tenant_id=rd.get("tenant_id", "tenant_acme"),
            statement=rd.get("statement", ""), domain=rd.get("domain", "general"),
            workflow_id=rd.get("workflow_id"), confidence_vector=vector,
            confidence_scalar=scalar, confidence_tier="INFERRED",
            half_life_days=rd.get("half_life_days", 90), is_executable=scalar >= 0.60,
            compliance_tags=rd.get("compliance_tags", []),
        )
        db.add(rule)
        imported += 1
    await db.commit()
    return {"status": "IMPORTED", "count": imported}


# ═══════════════════════════════════════════
# RULE VERSIONING (Git-like)
# ═══════════════════════════════════════════
@router.get("/rules/{rule_id}/versions")
async def get_rule_versions(rule_id: str, db: AsyncSession = Depends(get_db)):
    """Get version history of a rule via provenance chain."""
    r = await db.execute(
        select(ProvenanceLedger).where(ProvenanceLedger.rule_id == rule_id)
        .order_by(ProvenanceLedger.timestamp.asc())
    )
    entries = r.scalars().all()
    versions = []
    for i, e in enumerate(entries):
        versions.append({
            "version": i + 1, "event_type": e.event_type,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "actor": e.actor_role, "confidence_at": e.confidence_at,
            "reasoning": e.reasoning, "chain_hash": e.chain_hash,
        })
    return {"rule_id": rule_id, "total_versions": len(versions), "versions": versions}

class RuleCloneRequest(BaseModel):
    new_domain: Optional[str] = None

@router.post("/rules/{rule_id}/clone")
async def clone_rule(rule_id: str, body: RuleCloneRequest, db: AsyncSession = Depends(get_db)):
    """Clone a rule (fork) into a new domain with fresh provenance."""
    r = await db.execute(select(Rule).where(Rule.id == rule_id))
    original = r.scalar_one_or_none()
    if not original:
        raise HTTPException(404, "Rule not found")

    clone = Rule(
        id=str(uuid.uuid4()), tenant_id=original.tenant_id,
        statement=original.statement, trigger_json=original.trigger_json,
        action_json=original.action_json, exceptions_json=original.exceptions_json,
        domain=body.new_domain or original.domain, workflow_id=original.workflow_id,
        confidence_vector=dict(original.confidence_vector) if original.confidence_vector else {},
        confidence_scalar=original.confidence_scalar * 0.8,  # Discount for clone
        confidence_tier=original.confidence_tier, half_life_days=original.half_life_days,
        is_executable=False,  # Needs validation
        compliance_tags=original.compliance_tags, parent_version=original.id,
    )
    db.add(clone)

    # Provenance
    prov = ProvenanceLedger(
        id=str(uuid.uuid4()), rule_id=clone.id, event_type="CLONED",
        actor_hash="system", actor_role="clone_engine",
        evidence_ids=[], confidence_at=clone.confidence_scalar,
        reasoning=f"Cloned from rule {rule_id}", chain_hash=str(uuid.uuid4()),
    )
    db.add(prov)
    await db.commit()
    return {"status": "CLONED", "original_id": rule_id, "clone_id": clone.id}


# ═══════════════════════════════════════════
# SIMULATION ENGINE ("What-If")
# ═══════════════════════════════════════════
class SimulationRequest(BaseModel):
    rule_id: str
    scenario: str  # "decay_30d", "decay_90d", "remove_rule", "boost_confidence"
    params: dict = {}

@router.post("/simulate")
async def simulate_scenario(body: SimulationRequest, db: AsyncSession = Depends(get_db)):
    """Run a what-if simulation without modifying actual data."""
    r = await db.execute(select(Rule).where(Rule.id == body.rule_id))
    rule = r.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Rule not found")

    import math
    result = {"rule_id": body.rule_id, "scenario": body.scenario, "current_state": {
        "confidence": rule.confidence_scalar, "tier": rule.confidence_tier.value if rule.confidence_tier else "",
        "is_executable": rule.is_executable
    }}

    if body.scenario == "decay_30d":
        hl = rule.half_life_days or 90
        new_conf = rule.confidence_scalar * (0.5 ** (30 / hl))
        result["projected"] = {"confidence": round(new_conf, 4), "is_executable": new_conf >= 0.60,
                                "days": 30, "half_life": hl}
    elif body.scenario == "decay_90d":
        hl = rule.half_life_days or 90
        new_conf = rule.confidence_scalar * (0.5 ** (90 / hl))
        result["projected"] = {"confidence": round(new_conf, 4), "is_executable": new_conf >= 0.60,
                                "days": 90, "half_life": hl}
    elif body.scenario == "boost_confidence":
        from app.services.confidence import ConfidenceEngine
        ce = ConfidenceEngine()
        new_conf = ce.bayesian_update(rule.confidence_scalar, "DEPT_HEAD_VALIDATION")
        result["projected"] = {"confidence": round(new_conf, 4), "is_executable": new_conf >= 0.60,
                                "evidence": "DEPT_HEAD_VALIDATION"}
    elif body.scenario == "remove_rule":
        # Find dependent skills
        skills_q = await db.execute(select(Skill).where(Skill.domain == rule.domain))
        skills = skills_q.scalars().all()
        result["impact"] = {"affected_skills": len(skills),
                            "skill_ids": [s.skill_id for s in skills[:10]],
                            "warning": "Removing this rule may break dependent workflows"}
    else:
        result["error"] = f"Unknown scenario: {body.scenario}"

    return result


# ═══════════════════════════════════════════
# SCHEDULED REPORTS
# ═══════════════════════════════════════════
@router.get("/reports/health")
async def generate_health_report(db: AsyncSession = Depends(get_db)):
    """Generate a comprehensive KB health report."""
    # Rule stats
    r = await db.execute(select(sqlfunc.count(Rule.id)).where(Rule.is_archived == False))
    total_rules = r.scalar() or 0
    r = await db.execute(select(sqlfunc.count(Rule.id)).where(Rule.is_executable == True))
    exec_rules = r.scalar() or 0
    r = await db.execute(select(sqlfunc.avg(Rule.confidence_scalar)).where(Rule.is_archived == False))
    avg_conf = round(r.scalar() or 0, 4)

    # Skill stats
    r = await db.execute(select(sqlfunc.count(Skill.id)))
    total_skills = r.scalar() or 0
    r = await db.execute(select(sqlfunc.avg(Skill.success_rate)))
    avg_success = round(r.scalar() or 0, 4)
    r = await db.execute(select(sqlfunc.sum(Skill.execution_count)))
    total_execs = r.scalar() or 0

    # Decay alerts
    r = await db.execute(select(sqlfunc.count(Rule.id)).where(Rule.confidence_scalar < 0.30, Rule.is_archived == False))
    speculative_count = r.scalar() or 0

    # Coverage by domain
    r = await db.execute(
        select(Rule.domain, sqlfunc.count(Rule.id), sqlfunc.avg(Rule.confidence_scalar))
        .where(Rule.is_archived == False).group_by(Rule.domain)
    )
    domain_coverage = [{"domain": d, "rule_count": c, "avg_confidence": round(a or 0, 4)} for d, c, a in r.all()]

    return {
        "report_type": "KB_HEALTH",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_rules": total_rules, "executable_rules": exec_rules,
            "avg_confidence": avg_conf, "total_skills": total_skills,
            "avg_success_rate": avg_success, "total_executions": total_execs,
            "speculative_rules": speculative_count,
            "coverage_score": round(exec_rules / max(total_rules, 1), 4),
        },
        "domain_breakdown": domain_coverage,
        "alerts": [
            {"type": "SPECULATIVE_RULES", "count": speculative_count, "severity": "HIGH" if speculative_count > 5 else "LOW"},
        ]
    }

@router.get("/reports/compliance")
async def generate_compliance_report(db: AsyncSession = Depends(get_db)):
    """Generate compliance posture report."""
    frameworks = ["SOX", "GDPR", "HIPAA", "PCI", "CCPA"]
    coverage = []
    for fw in frameworks:
        r = await db.execute(
            select(sqlfunc.count(Rule.id)).where(Rule.compliance_tags.contains(fw))
        )
        count = r.scalar() or 0
        coverage.append({"framework": fw, "rule_count": count, "coverage": "COVERED" if count > 0 else "GAP"})

    r = await db.execute(select(sqlfunc.count(SecurityAuditLog.id)))
    audit_count = r.scalar() or 0

    return {
        "report_type": "COMPLIANCE_POSTURE",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "framework_coverage": coverage,
        "total_audit_events": audit_count,
    }


# ═══════════════════════════════════════════
# TENANT MANAGEMENT
# ═══════════════════════════════════════════
@router.get("/tenants/stats")
async def tenant_stats(db: AsyncSession = Depends(get_db)):
    """Get stats per tenant."""
    r = await db.execute(
        select(Rule.tenant_id, sqlfunc.count(Rule.id), sqlfunc.avg(Rule.confidence_scalar))
        .group_by(Rule.tenant_id)
    )
    tenants = [{"tenant_id": t, "rule_count": c, "avg_confidence": round(a or 0, 4)} for t, c, a in r.all()]

    r = await db.execute(
        select(Skill.tenant_id, sqlfunc.count(Skill.id), sqlfunc.avg(Skill.success_rate))
        .group_by(Skill.tenant_id)
    )
    skill_stats = {t: {"skill_count": c, "avg_success": round(a or 0, 4)} for t, c, a in r.all()}

    for t in tenants:
        ss = skill_stats.get(t["tenant_id"], {})
        t["skill_count"] = ss.get("skill_count", 0)
        t["avg_success_rate"] = ss.get("avg_success", 0)

    return {"tenants": tenants}
