from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class PolystoreEngine:
    """L3 - Multi-Modal Knowledge Base (Polystore)"""
    
    def __init__(self, db_session, vector_store, graph_store, temporal_store):
        self.db = db_session
        self.vector = vector_store
        self.graph = graph_store
        self.temporal = temporal_store
        
    async def write_knowledge(self, rule_data: Dict[str, Any]) -> str:
        """Writes knowledge across all four stores simultaneously."""
        logger.info(f"Writing rule to Polystore: {rule_data.get('statement')}")
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            session.add(rule_data)
            await session.commit()
            await session.refresh(rule_data)
        return rule_data.id

class GraphReasoningEngine:
    """L4 - Knowledge Graph Reasoning Engine"""
    
    def __init__(self, graph_store=None):
        self.graph = graph_store
        
    async def find_escalation_path(self, condition_id: str) -> List[Dict[str, Any]]:
        """Transitive Rule Inference - Finds all escalation paths for a given situation."""
        from app.services.llm_router import LLMRouter
        from app.core.database import AsyncSessionLocal
        from app.models.domain import Rule
        from sqlalchemy import select
        
        logger.info(f"Finding escalation path for condition rule: {condition_id}")
        
        async with AsyncSessionLocal() as db:
            rule_q = await db.execute(select(Rule).where(Rule.id == condition_id))
            base_rule = rule_q.scalar_one_or_none()
            
            if not base_rule:
                return []
                
            router = LLMRouter()
            prompt = f"Given the rule: '{base_rule.statement}', what are the logical escalation steps? Output a JSON list of objects with 'step' and 'rule'."
            try:
                res = await router.complete(prompt=prompt, model="gpt-4o-mini")
                import json
                return json.loads(res.get("content", "[]"))
            except Exception as e:
                logger.error(f"Failed to calculate escalation path: {e}")
                raise ValueError(f"Generative escalation pathing failed: {e}")
        
    async def find_conflict_surface(self, workflow_id: str) -> List[Dict[str, Any]]:
        """Detects rules that could conflict in the same workflow."""
        from app.core.database import AsyncSessionLocal
        from app.models.domain import ConflictCase, Rule
        from app.services.llm_router import LLMRouter
        from sqlalchemy import select
        import json
        
        logger.info(f"Finding conflict surface for workflow: {workflow_id}")
        conflicts = []
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Rule).where(Rule.workflow_id == workflow_id).limit(10))
            rules = result.scalars().all()
            
            if len(rules) >= 2:
                router = LLMRouter()
                for i in range(len(rules)):
                    for j in range(i+1, len(rules)):
                        if rules[i].domain == rules[j].domain:
                            # Use LLM to actually check for semantic contradiction
                            prompt = (
                                f"Do these two rules contradict each other?\n"
                                f"Rule 1: {rules[i].statement}\n"
                                f"Rule 2: {rules[j].statement}\n"
                                f"Return JSON format: {{\"contradiction\": true/false, \"reason\": \"explanation\"}}"
                            )
                            try:
                                res = await router.complete(prompt=prompt, model="gpt-4o-mini")
                                analysis = json.loads(res.get("content", "{}"))
                                if analysis.get("contradiction"):
                                    conflicts.append({
                                        "rule_a_id": rules[i].id,
                                        "rule_b_id": rules[j].id,
                                        "conflict_type": "DIRECT_CONTRADICTION",
                                        "severity": "MODERATE",
                                        "reason": analysis.get("reason")
                                    })
                            except Exception:
                                pass
        return conflicts
