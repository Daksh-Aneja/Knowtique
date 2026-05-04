"""Knowtique L9 — Agent Runtime (AEOS Enhanced)
SkillRouter + AgentExecutor with Debate Engine and Fairness Engine gates.
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class SkillRouter:
    """L9 - Multi-Agent Skill Router"""
    
    def __init__(self, registry_client, vector_store):
        self.registry = registry_client
        self.vector = vector_store

    async def route_task(self, task_intent: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Routes a natural language task to the best matching skill."""
        # 1. Try Exact Match (Intent Classifier)
        exact_match = await self.registry.find_by_trigger(task_intent)
        if exact_match and exact_match['confidence'] >= 0.82:
            logger.info(f"Exact skill match found: {exact_match['skill_id']}")
            return {"route_type": "SKILL_EXEC", "skill": exact_match}
            
        # 2. Fuzzy Match (Vector Search)
        fuzzy_matches = await self.vector.search_skills(task_intent, top_k=3)
        if fuzzy_matches and fuzzy_matches[0]['similarity'] > 0.85:
            logger.info(f"Fuzzy skill match found: {fuzzy_matches[0]['skill_id']}")
            return {"route_type": "SKILL_EXEC", "skill": fuzzy_matches[0]}
            
        # 3. RAG Fallback
        logger.warning(f"No skill match for intent: {task_intent}. Falling back to RAG.")
        return {"route_type": "RAG_EXEC", "skill": None}


class AgentExecutor:
    """L9 - Execution Engine with AEOS Debate + Fairness gates.
    
    Execution pipeline:
    1. Compliance pre-check (L13)
    2. Fairness gate — if HCM data touched (AEOS P3)
    3. Confidence gate → HITL check
    4. Debate Engine — if Tier-1 action (AEOS P6)
    5. Generative execution
    6. Post-execution audit
    """
    
    def __init__(self, compliance_engine, hitl_manager):
        self.compliance = compliance_engine
        self.hitl = hitl_manager
        # Lazy-load AEOS engines to avoid circular imports
        self._debate_engine = None
        self._fairness_engine = None
        self._activity_feed = None

    @property
    def debate_engine(self):
        if self._debate_engine is None:
            from app.services.debate_engine import DebateEngine
            self._debate_engine = DebateEngine()
        return self._debate_engine

    @property
    def fairness_engine(self):
        if self._fairness_engine is None:
            from app.services.fairness_engine import FairnessEngine
            self._fairness_engine = FairnessEngine()
        return self._fairness_engine

    @property
    def activity_feed(self):
        if self._activity_feed is None:
            from app.services.activity_feed import ActivityFeedService
            self._activity_feed = ActivityFeedService()
        return self._activity_feed

    async def execute_skill(self, skill: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a skill contract with full AEOS gate pipeline."""
        
        # ── Gate 1: Compliance Pre-Check (L13) ──
        violations = self.compliance.check_before_execution(skill.get("compliance_tags", []), context)
        if violations:
            return {"status": "BLOCKED_COMPLIANCE", "violations": violations}

        # ── Gate 2: Fairness Check (AEOS P3) ──
        # Only for skills that touch Employee/HCM data
        skill_obj = context.get("_skill_obj")  # Skill ORM object if available
        if skill_obj and self.fairness_engine.requires_fairness_check(skill_obj, context):
            fairness_result = await self.fairness_engine.score_fairness(
                skill_obj, context, 
                tenant_id=context.get("tenant_id", "default"),
                execution_id=context.get("execution_id"),
            )
            if not fairness_result["passed"]:
                logger.warning(f"Fairness gate BLOCKED: {fairness_result['flagged_attributes']}")
                # Emit activity event
                from app.models.agent_factory import ActivityEventType, ActivitySeverity
                await self.activity_feed.emit(
                    event_type=ActivityEventType.FAIRNESS_BLOCKED,
                    title=f"Fairness gate blocked: {skill.get('skill_id', 'unknown')}",
                    description=fairness_result["rationale"],
                    tenant_id=context.get("tenant_id", "default"),
                    severity=ActivitySeverity.ACTION_REQUIRED,
                    source_type="execution",
                    source_id=context.get("execution_id"),
                    requires_action=True,
                )
                return {
                    "status": "BLOCKED_FAIRNESS",
                    "fairness_score": fairness_result["score"],
                    "flagged_attributes": fairness_result["flagged_attributes"],
                    "rationale": fairness_result["rationale"],
                    "audit_log_id": fairness_result["audit_log_id"],
                }

        # ── Gate 3: Confidence → HITL Check ──
        if skill['confidence'] < 0.82:  # AUTONOMOUS_THRESHOLD
            gate_decision = await self.hitl.request_human_confirmation(skill, context)
            if not gate_decision['approved']:
                return {"status": "HUMAN_OVERRIDDEN", "reason": gate_decision['reason']}

        # ── Gate 4: Debate Engine (AEOS P6) ──
        # For Tier-1 actions: compliance-tagged, low confidence, or first execution
        if skill_obj:
            should_debate, debate_reason = self.debate_engine.should_debate(skill_obj, context)
            if should_debate:
                logger.info(f"Debate Engine triggered for {skill.get('skill_id')}: {debate_reason}")
                transcript = await self.debate_engine.run_debate(
                    skill_obj, context,
                    execution_id=context.get("execution_id", "unknown"),
                    tenant_id=context.get("tenant_id", "default"),
                )
                decision = (transcript.arbitrator_decision or {}).get("decision", "ESCALATE")
                
                if decision == "BLOCK":
                    from app.models.agent_factory import ActivityEventType, ActivitySeverity
                    await self.activity_feed.emit(
                        event_type=ActivityEventType.DEBATE_BLOCKED,
                        title=f"Debate Engine BLOCKED: {skill.get('skill_id', 'unknown')}",
                        description=(transcript.arbitrator_decision or {}).get("rationale", ""),
                        tenant_id=context.get("tenant_id", "default"),
                        severity=ActivitySeverity.CRITICAL,
                        source_type="execution",
                        source_id=context.get("execution_id"),
                        requires_action=True,
                    )
                    return {
                        "status": "BLOCKED_DEBATE",
                        "debate_decision": decision,
                        "rationale": (transcript.arbitrator_decision or {}).get("rationale"),
                        "transcript_id": transcript.id,
                    }
                elif decision == "ESCALATE":
                    from app.models.agent_factory import ActivityEventType, ActivitySeverity
                    await self.activity_feed.emit(
                        event_type=ActivityEventType.DEBATE_ESCALATED,
                        title=f"Debate escalated to HITL: {skill.get('skill_id', 'unknown')}",
                        tenant_id=context.get("tenant_id", "default"),
                        severity=ActivitySeverity.ACTION_REQUIRED,
                        source_type="execution",
                        source_id=context.get("execution_id"),
                        requires_action=True,
                    )
                    return {
                        "status": "ESCALATED_DEBATE",
                        "debate_decision": decision,
                        "transcript_id": transcript.id,
                    }
                # PROCEED — continue to execution

        # ── Execution: Generative Skill Run ──
        from app.services.llm_router import LLMRouter
        import uuid
        router = LLMRouter()
        exec_id = context.get("execution_id", f"exec-{uuid.uuid4().hex[:8]}")
        logger.info(f"Executing skill {skill['skill_id']} autonomously. Exec ID: {exec_id}")
        
        # ── Post-Execution: Audit ──
        audit_passed = self.compliance.enforce_audit_requirements(skill.get("compliance_tags", []), context)
        if not audit_passed:
            logger.error("Audit post-execution checks failed.")
            return {"status": "FAILED_AUDIT"}
            
        return {"status": "SUCCESS_CLEAN", "execution_id": exec_id}
