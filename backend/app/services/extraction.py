from typing import Dict, Any, List
import json

class ContradictionDetector:
    """L2 - Knowledge Extraction Engine (Conflict sub-system)"""
    
    async def detect(self, candidate_rule: Dict[str, Any], existing_kb: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detects if a new candidate rule contradicts the existing KB via Semantic Evaluation."""
        from app.services.llm_router import LLMRouter
        router = LLMRouter()
        
        for rule in existing_kb:
            if rule['domain'] == candidate_rule['domain']:
                # Semantic Logical Conflict Analysis using LLM
                prompt = (
                    f"Do these two rules contradict each other or overlap?\n"
                    f"Rule A (existing): {rule.get('statement')} (Trigger: {rule.get('trigger_json')}, Action: {rule.get('action_json')})\n"
                    f"Rule B (new): {candidate_rule.get('statement')} (Trigger: {candidate_rule.get('trigger_json')}, Action: {candidate_rule.get('action_json')})\n"
                    f"Return JSON: {{\"conflict\": true/false, \"type\": \"DIRECT_CONTRADICTION\" or \"SCOPE_OVERLAP\" or \"NONE\", \"action\": \"BLOCK_AND_ESCALATE\" or \"MERGE\" or \"ADD_TO_KB\"}}"
                )
                
                try:
                    res = await router.complete(prompt=prompt, model="gpt-4o-mini")
                    analysis = json.loads(res.get("content", "{}"))
                    if analysis.get("conflict"):
                        return {
                            "conflict": True,
                            "type": analysis.get("type", "DIRECT_CONTRADICTION"),
                            "conflicting_rule_id": rule['id'],
                            "action": analysis.get("action", "BLOCK_AND_ESCALATE")
                        }
                except Exception as e:
                    import logging
                    logging.error(f"Semantic conflict check failed: {e}")
                    raise ValueError(f"Semantic logical validation failed during rule extraction: {e}")
                            
        return {"conflict": False, "type": "INDEPENDENT", "action": "ADD_TO_KB"}

class RuleMiner:
    """L2 - Rule Mining Sub-Engine"""
    
    async def extract_rule(self, signal_cluster: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Uses LLM to articulate a rule from a cluster of signals."""
        from app.services.llm_router import LLMRouter
        
        if len(signal_cluster) < 3:
            return None # Minimum cluster size not met
            
        router = LLMRouter()
        
        signals_text = "\n".join([f"- {s.get('clean_payload', str(s))}" for s in signal_cluster])
        prompt = (
            f"You are the Knowtique Rule Miner. Analyze this cluster of historical events/signals and extract the underlying business rule.\n"
            f"Signals:\n{signals_text}\n"
            f"Output JSON format strictly: {{\"statement\": \"plain text rule\", \"trigger_json\": {{\"condition\": \"X\"}}, \"action_json\": {{\"action\": \"Y\"}}}}"
        )
        
        try:
            res = await router.complete(prompt=prompt, model="gpt-4o")
            rule_data = json.loads(res.get("content", "{}"))
            rule_data["confidence_basis"] = f"{len(signal_cluster)} consistent instances"
            return rule_data
        except Exception:
            return None
