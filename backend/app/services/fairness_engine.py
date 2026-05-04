"""Knowtique — Fairness Engine (AEOS P3 — Ethical AI & Bias Guardrails)
Demographic fairness scoring for HCM-touching agent actions.
EU AI Act Article 13 + GDPR Article 22 compliant.
"""
import logging, json
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.fairness import FairnessAuditLog, FairnessConfig
from app.models.domain import Skill
from app.services.llm_router import LLMRouter

logger = logging.getLogger(__name__)

# Entity types that trigger mandatory fairness checks
HCM_ENTITY_TYPES = {
    "Employee", "Compensation", "Schedule", "Performance",
    "Hiring", "Promotion", "Termination", "Benefits"
}

DEFAULT_PROTECTED_ATTRIBUTES = ["gender", "ethnicity", "age", "disability", "nationality"]
DEFAULT_THRESHOLD = 0.85


class FairnessEngine:
    """Scores agent actions for demographic fairness before execution.
    
    Any action touching Employee/HCM data is assessed against protected
    attributes. Actions below the fairness threshold are blocked and
    escalated to human review with full audit trail.
    """

    def __init__(self):
        self.llm = LLMRouter()

    def requires_fairness_check(self, skill: Skill, context: dict) -> bool:
        """Determine if a skill execution needs fairness assessment."""
        # Check domain
        domain = (skill.domain or "").lower()
        if any(hcm in domain for hcm in ["hr", "hcm", "employee", "hiring", "compensation", "workforce"]):
            return True

        # Check department
        dept = (skill.department or "").lower()
        if dept in ["human_resources", "hr", "people_ops", "talent"]:
            return True

        # Check MCP tool bindings for HCM tools
        tools = skill.mcp_tool_bindings or []
        hcm_tools = ["hris_read", "hris_write", "compensation_update", "schedule_update", "performance_write"]
        if any(t in tools for t in hcm_tools):
            return True

        # Check context for explicit entity type
        entity_type = context.get("affected_entity_type", "")
        if entity_type in HCM_ENTITY_TYPES:
            return True

        return False

    async def score_fairness(
        self,
        skill: Skill,
        context: dict,
        tenant_id: str,
        execution_id: Optional[str] = None,
        blueprint_id: Optional[str] = None,
    ) -> dict:
        """Run fairness assessment and persist audit log.
        
        Returns: { score, passed, flagged_attributes, rationale, audit_log_id }
        """
        # Load tenant config
        config = await self._get_config(tenant_id, skill.department)
        threshold = config.get("threshold", DEFAULT_THRESHOLD)
        attributes = config.get("attributes", DEFAULT_PROTECTED_ATTRIBUTES)

        # Build assessment context
        action_desc = self._build_action_description(skill, context)

        # LLM fairness assessment
        assessment = await self._assess_fairness(action_desc, attributes)

        score = assessment.get("overall_score", 0.5)
        passed = score >= threshold
        flagged = assessment.get("flagged_attributes", [])

        # Persist audit log
        log = FairnessAuditLog(
            tenant_id=tenant_id,
            execution_id=execution_id,
            blueprint_id=blueprint_id,
            fairness_score=score,
            threshold_used=threshold,
            passed=passed,
            protected_attributes_assessed=attributes,
            attribute_scores=assessment.get("attribute_scores", {}),
            flagged_attributes=flagged,
            rationale=assessment.get("rationale", "Assessment completed."),
            action_description=action_desc,
            affected_entity_type=context.get("affected_entity_type", "Employee"),
            affected_entity_count=context.get("affected_count", 0),
        )

        async with AsyncSessionLocal() as session:
            session.add(log)
            await session.commit()
            await session.refresh(log)

        status = "PASSED" if passed else "BLOCKED"
        logger.info(f"[Fairness] {status}: score={score:.2f} threshold={threshold} flagged={flagged}")

        return {
            "score": score,
            "passed": passed,
            "flagged_attributes": flagged,
            "rationale": assessment.get("rationale", ""),
            "attribute_scores": assessment.get("attribute_scores", {}),
            "audit_log_id": log.id,
        }

    async def override_block(
        self, log_id: str, tenant_id: str, override_by: str, justification: str
    ) -> dict:
        """Override a fairness block with justification (audited)."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(FairnessAuditLog).where(
                    FairnessAuditLog.id == log_id,
                    FairnessAuditLog.tenant_id == tenant_id,
                )
            )
            log = result.scalar_one_or_none()
            if not log:
                raise ValueError(f"Fairness audit log {log_id} not found")

            log.was_overridden = True
            log.override_by = override_by
            log.override_justification = justification
            log.override_at = datetime.now(timezone.utc)
            await session.commit()

            logger.warning(f"[Fairness] OVERRIDE: log={log_id} by={override_by}")
            return {"status": "overridden", "log_id": log_id}

    async def _get_config(self, tenant_id: str, department: Optional[str] = None) -> dict:
        """Get fairness config for tenant/department."""
        async with AsyncSessionLocal() as session:
            # Try department-specific first
            if department:
                result = await session.execute(
                    select(FairnessConfig).where(
                        FairnessConfig.tenant_id == tenant_id,
                        FairnessConfig.department == department,
                    )
                )
                config = result.scalar_one_or_none()
                if config:
                    return {
                        "threshold": config.fairness_threshold,
                        "attributes": config.protected_attributes,
                        "allow_override": config.allow_override,
                    }

            # Fall back to org-wide
            result = await session.execute(
                select(FairnessConfig).where(
                    FairnessConfig.tenant_id == tenant_id,
                    FairnessConfig.department == None,  # noqa: E711
                )
            )
            config = result.scalar_one_or_none()
            if config:
                return {
                    "threshold": config.fairness_threshold,
                    "attributes": config.protected_attributes,
                    "allow_override": config.allow_override,
                }

        return {"threshold": DEFAULT_THRESHOLD, "attributes": DEFAULT_PROTECTED_ATTRIBUTES, "allow_override": True}

    def _build_action_description(self, skill: Skill, context: dict) -> str:
        steps = ", ".join(s.get("action", "?") for s in (skill.steps or [])[:5])
        return f"Skill '{skill.skill_id}' in {skill.department}/{skill.domain}: {steps}. Intent: {context.get('intent', 'N/A')}"

    async def _assess_fairness(self, action_desc: str, attributes: list) -> dict:
        """Use LLM to assess fairness impact across protected attributes."""
        try:
            prompt = f"""You are an AI Ethics & Fairness assessor for enterprise HCM systems.
Assess the following action for potential disparate impact on protected demographic groups.

ACTION: {action_desc}

PROTECTED ATTRIBUTES TO ASSESS: {', '.join(attributes)}

For each attribute, score 0.0-1.0 (1.0 = perfectly fair, 0.0 = severe bias risk).
Flag any attribute scoring below 0.85.

Respond in JSON:
{{"overall_score": 0.0-1.0, "attribute_scores": {{"gender": {{"score": 0.9, "flag": false}}}}, "flagged_attributes": ["age"], "rationale": "Plain language explanation suitable for regulators"}}"""

            resp = await self.llm.complete(prompt=prompt, model_tier="reasoning", temperature=0.2)
            cleaned = resp.strip()
            for p in ["```json", "```"]:
                if cleaned.startswith(p): cleaned = cleaned[len(p):]
            if cleaned.endswith("```"): cleaned = cleaned[:-3]
            try:
                return json.loads(cleaned.strip())
            except json.JSONDecodeError:
                return json.loads(resp[resp.index("{"):resp.rindex("}") + 1])
        except Exception as e:
            logger.error(f"[Fairness] Assessment failed: {e}")
            return {
                "overall_score": 0.5,
                "attribute_scores": {},
                "flagged_attributes": ["assessment_error"],
                "rationale": f"Fairness assessment failed: {str(e)}. Defaulting to cautious score.",
            }
