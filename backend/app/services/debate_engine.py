"""Knowtique — Agent Debate Engine (AEOS P6)
Proposer / Devil's Advocate / Arbitrator adversarial reasoning.
"""
import logging, time, json
from typing import Dict, Any, Optional

from app.core.database import AsyncSessionLocal
from app.models.agent_factory import DebateTranscript, DebateDecision
from app.models.domain import Skill
from app.services.llm_router import LLMRouter

logger = logging.getLogger(__name__)

TIER_1_TAGS = {"SOX", "GDPR", "HIPAA", "PCI_DSS", "EEOC", "SOC2"}
DEBATE_CONFIDENCE_THRESHOLD = 0.85
ARBITRATOR_ESCALATION_THRESHOLD = 0.7


class DebateEngine:
    """Adversarial Proposer/Advocate/Arbitrator debate for Tier-1 actions."""

    def __init__(self):
        self.llm = LLMRouter()

    def should_debate(self, skill: Skill, context: dict) -> tuple:
        tags = set(skill.compliance_tags or [])
        overlap = tags & TIER_1_TAGS
        if overlap:
            return True, f"compliance_tag:{','.join(overlap)}"
        if skill.confidence < DEBATE_CONFIDENCE_THRESHOLD:
            return True, "low_confidence"
        if skill.execution_count == 0:
            return True, "first_execution"
        if context.get("force_debate"):
            return True, "explicitly_requested"
        return False, ""

    async def run_debate(self, skill: Skill, context: dict, execution_id: str, tenant_id: str) -> DebateTranscript:
        start = time.time()
        should, reason = self.should_debate(skill, context)

        if not should:
            t = DebateTranscript(
                tenant_id=tenant_id, execution_id=execution_id, skill_id=skill.skill_id,
                tier_level=0, trigger_reason="not_required",
                arbitrator_decision={"final_confidence": skill.confidence, "rationale": "Debate not triggered.", "decision": "PROCEED", "weight_proposer": 0, "weight_advocate": 0},
                debate_duration_ms=0,
            )
            async with AsyncSessionLocal() as session:
                session.add(t)
                await session.commit()
                await session.refresh(t)
            return t

        logger.info(f"[Debate] Starting for {skill.skill_id} — {reason}")
        ctx = self._build_context(skill, context)

        proposer = await self._proposer(ctx)
        advocate = await self._advocate(ctx, proposer)
        arbitrator = await self._arbitrator(ctx, proposer, advocate)

        dur = int((time.time() - start) * 1000)
        escalated = arbitrator.get("final_confidence", 0) < ARBITRATOR_ESCALATION_THRESHOLD

        t = DebateTranscript(
            tenant_id=tenant_id, execution_id=execution_id, skill_id=skill.skill_id,
            tier_level=1, trigger_reason=reason,
            proposer_argument=proposer, advocate_argument=advocate, arbitrator_decision=arbitrator,
            debate_duration_ms=dur, escalated_to_hitl=escalated,
        )
        async with AsyncSessionLocal() as session:
            session.add(t)
            await session.commit()
            await session.refresh(t)

        logger.info(f"[Debate] {skill.skill_id}: decision={arbitrator.get('decision')}, conf={arbitrator.get('final_confidence',0):.2f}, {dur}ms")
        return t

    def _build_context(self, skill: Skill, context: dict) -> str:
        steps = "\n".join(f"  Step {i+1}: {s.get('action','?')}" for i, s in enumerate(skill.steps or []))
        return f"SKILL: {skill.skill_id} | Dept: {skill.department} | Conf: {skill.confidence} ({skill.confidence_tier}) | Success: {skill.success_rate} over {skill.execution_count} runs | Tags: {skill.compliance_tags}\nSTEPS:\n{steps}\nINTENT: {context.get('intent','N/A')}"

    async def _proposer(self, ctx: str) -> dict:
        try:
            prompt = f"""You are the PROPOSER AGENT. Build an affirmative case for executing this action.
Provide minimum 3 evidence points grounded in the skill data. Cite specific numbers.

{ctx}

Respond in JSON: {{"evidence":["...","...","..."],"conclusion":"...","confidence":0.0-1.0,"grounded_in":["..."]}}"""
            resp = await self.llm.complete(prompt=prompt, model_tier="reasoning", temperature=0.3)
            return self._parse_json(resp)
        except Exception as e:
            return {"evidence": [str(e)], "conclusion": "Error", "confidence": 0.3, "grounded_in": []}

    async def _advocate(self, ctx: str, proposer: dict) -> dict:
        try:
            prompt = f"""You are the DEVIL'S ADVOCATE. Find flaws, risks, counter-evidence against this action.
Check if Proposer's claims are grounded. Identify edge cases and blast radius.

{ctx}

PROPOSER: {json.dumps(proposer, default=str)[:800]}

Respond in JSON: {{"counter_evidence":["..."],"risks":["..."],"conclusion":"...","ungrounded_claims_found":0}}"""
            resp = await self.llm.complete(prompt=prompt, model_tier="reasoning", temperature=0.4)
            return self._parse_json(resp)
        except Exception as e:
            return {"counter_evidence": [str(e)], "risks": ["Analysis failed"], "conclusion": "Escalate", "ungrounded_claims_found": 0}

    async def _arbitrator(self, ctx: str, proposer: dict, advocate: dict) -> dict:
        try:
            prompt = f"""You are the ARBITRATOR. Evaluate Proposer vs Advocate and render a decision.
>=0.7 confidence: PROCEED | 0.5-0.69: ESCALATE | <0.5: BLOCK

{ctx}

PROPOSER: {json.dumps(proposer, default=str)[:600]}
ADVOCATE: {json.dumps(advocate, default=str)[:600]}

Respond in JSON: {{"final_confidence":0.0-1.0,"rationale":"...","decision":"PROCEED|ESCALATE|BLOCK","weight_proposer":0.0-1.0,"weight_advocate":0.0-1.0}}"""
            resp = await self.llm.complete(prompt=prompt, model_tier="reasoning", temperature=0.2)
            result = self._parse_json(resp)
            c = result.get("final_confidence", 0.5)
            result["decision"] = "PROCEED" if c >= 0.7 else ("ESCALATE" if c >= 0.5 else "BLOCK")
            return result
        except Exception as e:
            return {"final_confidence": 0.0, "rationale": str(e), "decision": "ESCALATE", "weight_proposer": 0, "weight_advocate": 0}

    def _parse_json(self, response: str) -> dict:
        cleaned = response.strip()
        for prefix in ["```json", "```"]:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            try:
                return json.loads(response[response.index("{"):response.rindex("}") + 1])
            except (ValueError, json.JSONDecodeError):
                return {"error": "parse_failed", "raw": response[:300]}
