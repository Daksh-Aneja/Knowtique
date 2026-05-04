"""
Knowtique — Gate 5: Skill Execution Engine
Replaces the stub in AgentExecutor.execute_skill() after the Debate gate clears.

Responsibilities:
  - Run each SKILL.md step through the LLM with full context
  - Accumulate a structured reasoning_chain
  - Write a SkillExecution record (timing, status, outcome)
  - Update Skill execution stats + Bayesian confidence
  - Trigger EvolutionEngine on failure so the KB self-heals
  - Append a ProvenanceLedger entry for the execution event
"""
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.domain import Skill, SkillExecution, ProvenanceLedger
from app.services.llm_router import LLMRouter
from app.services.confidence import ConfidenceEngine
from app.services.provenance import ProvenanceEngine

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────
_EXEC_SYSTEM_PROMPT = """\
You are the Knowtique AEOS Execution Engine.
You are executing a single step of a verified enterprise skill contract.
Reason carefully. Return ONLY valid JSON matching the schema requested.
Never fabricate tool results. If a tool call would fail, surface the error clearly.
"""

_STEP_PROMPT_TEMPLATE = """\
SKILL: {skill_id}  |  Step {step_num}/{total_steps}  |  Tenant: {tenant_id}
ACTION: {action}
TOOL: {tool}
CONDITION: {condition}
THRESHOLDS: {thresholds}

EXECUTION CONTEXT:
{context}

REASONING CHAIN SO FAR:
{prior_chain}

Execute this step. Return JSON:
{{
  "step_id": "{step_id}",
  "action": "{action}",
  "status": "SUCCESS" | "FAILED" | "SKIPPED",
  "tool_called": "<tool name or null>",
  "tool_result": "<result summary or null>",
  "decision": "<what was decided and why>",
  "confidence": 0.0-1.0,
  "side_effects": ["<list of state changes made>"],
  "error": "<error message if FAILED, else null>"
}}
"""


class SkillExecutionEngine:
    """
    Gate 5 of the AEOS pipeline — the actual generative execution layer.

    Called by AgentExecutor after Debate/HITL clears. Runs each step in the
    skill's `steps` array sequentially, accumulating a reasoning_chain.
    Persists a SkillExecution record and updates the Skill's live stats.
    """

    def __init__(self):
        self.llm = LLMRouter()
        self.confidence_engine = ConfidenceEngine()
        self.provenance = ProvenanceEngine()

    async def run(
        self,
        skill: dict,
        context: dict,
        execution_id: str,
        tenant_id: str,
        skill_obj=None,  # ORM Skill object if available
    ) -> dict:
        """
        Execute all steps of a skill contract sequentially.

        Returns a result dict with status, reasoning_chain, duration_ms,
        and execution_id — consumed by AgentExecutor to finalize the response.
        """
        start_ts = time.time()
        skill_id = skill.get("skill_id", "unknown")
        steps = skill.get("steps", [])

        if not steps:
            logger.warning(f"[Exec] Skill {skill_id} has no steps — trivial success.")
            return self._result("SUCCESS_CLEAN", [], execution_id, 0, skill_id)

        reasoning_chain = []
        final_status = "SUCCESS_CLEAN"
        failed_step = None

        logger.info(f"[Exec] Starting {skill_id} ({len(steps)} steps) — exec_id={execution_id}")

        for idx, step in enumerate(steps):
            step_result = await self._execute_step(
                step=step,
                step_num=idx + 1,
                total_steps=len(steps),
                skill_id=skill_id,
                tenant_id=tenant_id,
                context=context,
                prior_chain=reasoning_chain,
            )
            reasoning_chain.append(step_result)

            if step_result.get("status") == "FAILED":
                logger.error(
                    f"[Exec] Step {step.get('id','?')} FAILED: {step_result.get('error')}"
                )
                final_status = "FAILED_RULE_MISMATCH"
                failed_step = step
                break  # Stop on first failure — do not proceed

        duration_ms = int((time.time() - start_ts) * 1000)

        # ── Persist SkillExecution record ──────────────────────────────────
        await self._persist_execution(
            skill=skill,
            skill_obj=skill_obj,
            execution_id=execution_id,
            tenant_id=tenant_id,
            context=context,
            reasoning_chain=reasoning_chain,
            status=final_status,
            duration_ms=duration_ms,
        )

        # ── Update Skill stats + Bayesian confidence ───────────────────────
        if skill_obj is not None:
            await self._update_skill_stats(
                skill_obj=skill_obj,
                succeeded=(final_status == "SUCCESS_CLEAN"),
            )

        # ── Trigger Evolution on failure ───────────────────────────────────
        if final_status != "SUCCESS_CLEAN" and failed_step:
            await self._trigger_evolution(
                execution_id=execution_id,
                task_intent=context.get("intent", skill_id),
                context_data=context,
                skill_id=skill_id,
                department=skill.get("department", "general"),
                tenant_id=tenant_id,
            )

        # ── Provenance ledger entry ────────────────────────────────────────
        if skill_obj is not None:
            await self._write_provenance(
                skill_obj=skill_obj,
                execution_id=execution_id,
                status=final_status,
                confidence=skill.get("confidence", 0.0),
                tenant_id=tenant_id,
            )

        logger.info(
            f"[Exec] {skill_id} → {final_status} in {duration_ms}ms "
            f"({len(reasoning_chain)} steps completed)"
        )

        return self._result(final_status, reasoning_chain, execution_id, duration_ms, skill_id)

    # ── Private: step execution ───────────────────────────────────────────

    async def _execute_step(
        self,
        step: dict,
        step_num: int,
        total_steps: int,
        skill_id: str,
        tenant_id: str,
        context: dict,
        prior_chain: list,
    ) -> dict:
        """Run one step via LLM and return a structured result dict."""
        prompt = _STEP_PROMPT_TEMPLATE.format(
            skill_id=skill_id,
            step_num=step_num,
            total_steps=total_steps,
            tenant_id=tenant_id,
            action=step.get("action", "unknown"),
            tool=step.get("tool", "none"),
            condition=step.get("condition", "none"),
            thresholds=step.get("thresholds", {}),
            step_id=step.get("id", f"step_{step_num}"),
            context=_truncate(str(context), 600),
            prior_chain=_truncate(_format_chain(prior_chain), 800),
        )

        try:
            raw = await self.llm.complete(
                prompt=prompt,
                system_prompt=_EXEC_SYSTEM_PROMPT,
                model_tier="fast",        # Groq Llama-70B — fast, cheap per step
                temperature=0.0,          # Deterministic execution
                max_tokens=512,
            )
            content = raw if isinstance(raw, str) else raw.get("content", "{}")
            result = _safe_parse_json(content)

            # Ensure mandatory fields are present
            result.setdefault("step_id", step.get("id", f"step_{step_num}"))
            result.setdefault("action", step.get("action", "unknown"))
            result.setdefault("status", "SUCCESS")
            result.setdefault("confidence", 0.8)
            return result

        except Exception as exc:
            logger.error(f"[Exec] LLM step execution error on step {step_num}: {exc}")
            return {
                "step_id": step.get("id", f"step_{step_num}"),
                "action": step.get("action", "unknown"),
                "status": "FAILED",
                "tool_called": None,
                "tool_result": None,
                "decision": "LLM call failed",
                "confidence": 0.0,
                "side_effects": [],
                "error": str(exc),
            }

    # ── Private: persistence ──────────────────────────────────────────────

    async def _persist_execution(
        self,
        skill: dict,
        skill_obj,
        execution_id: str,
        tenant_id: str,
        context: dict,
        reasoning_chain: list,
        status: str,
        duration_ms: int,
    ) -> None:
        async with AsyncSessionLocal() as session:
            record = SkillExecution(
                id=execution_id,
                skill_db_id=skill_obj.id if skill_obj else None,
                skill_id_name=skill.get("skill_id", "unknown"),
                tenant_id=tenant_id,
                status=status,
                route_type="SKILL_EXEC",
                agent_state="COMPLETED" if status == "SUCCESS_CLEAN" else "FAILED",
                task_intent=context.get("intent", ""),
                context=context,
                reasoning_chain=reasoning_chain,
                completed_at=datetime.now(timezone.utc),
                duration_ms=duration_ms,
                outcome_type=status,
                hitl_required=False,
            )
            session.add(record)
            await session.commit()

    async def _update_skill_stats(self, skill_obj, succeeded: bool) -> None:
        """
        Update execution_count, success_rate, and Bayesian confidence on the Skill row.
        Uses the ConfidenceEngine.bayesian_update() already implemented.
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Skill).where(Skill.id == skill_obj.id)
            )
            skill = result.scalar_one_or_none()
            if not skill:
                return

            skill.execution_count = (skill.execution_count or 0) + 1
            prior_successes = int((skill.success_rate or 0.0) * max(1, skill.execution_count - 1))
            new_successes = prior_successes + (1 if succeeded else 0)
            skill.success_rate = new_successes / skill.execution_count

            # Bayesian confidence update
            evidence = "AGENT_SUCCESS" if succeeded else "AGENT_FAILURE"
            skill.confidence = self.confidence_engine.bayesian_update(
                prior=skill.confidence or 0.5,
                evidence_type=evidence,
            )

            await session.commit()
            logger.info(
                f"[Exec] Skill stats updated: {skill.skill_id} "
                f"count={skill.execution_count} success_rate={skill.success_rate:.3f} "
                f"confidence={skill.confidence:.3f}"
            )

    async def _write_provenance(
        self,
        skill_obj,
        execution_id: str,
        status: str,
        confidence: float,
        tenant_id: str,
    ) -> None:
        async with AsyncSessionLocal() as session:
            await self.provenance.log_event(
                db_session=session,
                rule_id=skill_obj.id,
                event_type="AGENT_EXECUTION",
                actor_hash=_hash_actor(f"aeos_exec_{execution_id}"),
                actor_role="AEOS_RUNTIME",
                evidence_ids=[],
                confidence_at=confidence,
                reasoning=f"Gate 5 execution: {status}",
            )

    async def _trigger_evolution(
        self,
        execution_id: str,
        task_intent: str,
        context_data: dict,
        skill_id: str,
        department: str,
        tenant_id: str,
    ) -> None:
        """Async fire-and-forget — don't block the execution response."""
        try:
            from app.services.evolution import EvolutionEngine
            await EvolutionEngine.handle_agent_failure(
                execution_id=execution_id,
                task_intent=task_intent,
                context_data=context_data,
                skill_id=skill_id,
                department=department,
                tenant_id=tenant_id,
            )
        except Exception as exc:
            # Evolution failure should never crash the execution response
            logger.error(f"[Exec] EvolutionEngine trigger failed: {exc}")

    # ── Private: helpers ──────────────────────────────────────────────────

    @staticmethod
    def _result(
        status: str,
        reasoning_chain: list,
        execution_id: str,
        duration_ms: int,
        skill_id: str,
    ) -> dict:
        return {
            "status": status,
            "execution_id": execution_id,
            "skill_id": skill_id,
            "steps_completed": len(reasoning_chain),
            "reasoning_chain": reasoning_chain,
            "duration_ms": duration_ms,
        }


def _safe_parse_json(raw: str) -> dict:
    import json
    try:
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(clean)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"LLM response parse failed: {e}")
        return {"status": "FAILED", "error": f"Could not parse LLM response: {raw[:200]}"}


def _format_chain(chain: list) -> str:
    if not chain:
        return "(none)"
    lines = []
    for s in chain:
        lines.append(
            f"  [{s.get('step_id','?')}] {s.get('action','?')} → "
            f"{s.get('status','?')}: {s.get('decision','')[:120]}"
        )
    return "\n".join(lines)


def _truncate(text: str, max_chars: int) -> str:
    return text if len(text) <= max_chars else text[:max_chars] + "…"


def _hash_actor(actor_str: str) -> str:
    import hashlib
    return hashlib.sha256(actor_str.encode()).hexdigest()
