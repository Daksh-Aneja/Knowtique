"""Knowtique — L10 Evolution Engine (Closed-Loop Feedback)"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import json

from app.models.domain import Skill, SkillExecution, Employee, ElicitationQuestion

from app.core.database import AsyncSessionLocal

class EvolutionEngine:
    """
    Handles the L10 feedback loop. When an agent fails, it autonomously 
    generates an elicitation question targeted at the relevant domain expert.
    """

    @staticmethod
    async def handle_agent_failure(execution_id: str, task_intent: str, context_data: dict, skill_id: str, department: str, tenant_id: str):
        """
        Triggered when a skill execution fails (e.g., FAILED_RULE_MISMATCH).
        Finds the domain expert and creates an ElicitationQuestion.
        """
        async with AsyncSessionLocal() as db:
            # 1. Find the best expert for this domain (highest authority_score)
            expert_q = await db.execute(
                select(Employee)
                .where(Employee.department == department)
                .order_by(Employee.authority_score.desc())
                .limit(1)
            )
            expert = expert_q.scalar_one_or_none()
        
            # Fallback to any employee if department expert not found
            if not expert:
                any_emp_q = await db.execute(select(Employee).limit(1))
                expert = any_emp_q.scalar_one_or_none()
                
            if not expert:
                print(f"[EvolutionEngine] No employees found to handle failure for {skill_id}")
                return
                
            # 2. Generate the Elicitation Question text
            context_str = json.dumps(context_data)[:100] if context_data else "{}"
            
            question_text = (
                f"Hi {expert.display_name or 'there'}, an agent recently failed while executing the '{skill_id}' skill "
                f"for the intent '{task_intent}'. It encountered an edge case with the following context: {context_str}... "
                f"Could you explain the unwritten rule or exception that applies here?"
            )
            
            # 3. Insert the ElicitationQuestion into the database
            eq = ElicitationQuestion(
                tenant_id=tenant_id,
                employee_id=expert.id,
                question_text=question_text,
                question_type="EXCEPTION_HANDLING",
                context_ref=f"exec:{execution_id}",
                priority="HIGH",
                delivery_channel="slack",
                status="PENDING",
                specificity=0.85,
                groundedness=0.90,
                answerability=0.75,
            )
            
            db.add(eq)
            await db.commit()
            print(f"[EvolutionEngine] Autonomously generated ElicitationQuestion for {expert.display_name} regarding {skill_id} failure.")
