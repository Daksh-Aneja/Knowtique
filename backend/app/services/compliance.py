from typing import List, Dict, Any

class ComplianceEngine:
    """L13 - Regulatory Compliance & Policy Enforcement Engine"""
    
    COMPLIANCE_FRAMEWORKS = {
        "GDPR": ["customer_data", "consent", "right_to_erasure", "data_retention"],
        "HIPAA": ["medical_records", "phi_handling", "minimum_necessary"],
        "SOX": ["financial_controls", "approval_chains", "audit_trail"],
        "PCI": ["payment_data", "card_handling", "encryption"],
        "CCPA": ["california_consumers", "opt_out", "data_sale"],
    }

    def check_before_execution(self, skill_tags: List[str], context: Dict[str, Any]) -> List[Dict[str, str]]:
        """Validates execution context against compliance frameworks before an agent acts."""
        violations = []
        
        for tag in skill_tags:
            if tag == "SOX":
                if not context.get("has_human_approver"):
                    violations.append({
                        "framework": "SOX",
                        "severity": "BLOCKER",
                        "reason": "SOX requires human approver for this financial action."
                    })
            elif tag == "GDPR":
                if not context.get("consent_verified"):
                    violations.append({
                        "framework": "GDPR",
                        "severity": "BLOCKER",
                        "reason": "GDPR requires consent verification before processing."
                    })
            elif tag == "PCI":
                if "raw_card_data" in context:
                    violations.append({
                        "framework": "PCI",
                        "severity": "BLOCKER",
                        "reason": "PCI blocks raw card data handling in agent context."
                    })
                    
        return violations

    def enforce_audit_requirements(self, skill_tags: List[str], execution_outcome: Dict[str, Any]) -> bool:
        """Ensures post-execution audit requirements are met."""
        for tag in skill_tags:
            if tag == "SOX":
                if not execution_outcome.get("financial_amount_logged"):
                    return False
        return True
