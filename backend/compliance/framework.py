from typing import Dict, Any, List, Optional
from backend.models.compliance import ComplianceAudit, RemediationStep
from backend.compliance.validators.base import BaseValidator
from backend.compliance.validators.asc820 import ASC820Validator
from backend.compliance.validators.sox404 import SOX404Validator
from backend.compliance.validators.lending import LendingComplianceValidator
from datetime import datetime

class ComplianceFramework:
    """
    Central registry for compliance checks.
    Aggregates results and calculates total risk.
    """
    
    def __init__(self):
        self.validators: Dict[str, BaseValidator] = {
            "asc_820": ASC820Validator(),
            "asc_820": ASC820Validator(),
            "sox_404": SOX404Validator(),
            "lending_covenants": LendingComplianceValidator()
        }

    def audit_valuation(self, valuation_id: str, valuation_data: Dict[str, Any], requested_regs: Optional[List[str]] = None) -> ComplianceAudit:
        results = {}
        total_risk_score = 0.0
        total_weight = 0.0
        remediation_plan = []
        
        # 1. Run Validators
        for key, validator in self.validators.items():
            if requested_regs and key not in requested_regs:
                continue
                
            res = validator.validate(valuation_data)
            results[key] = res
            
            # Weighted Score Calculation
            total_risk_score += res.risk_score * res.weight
            total_weight += res.weight
            
            # Generate Remediation Steps for failures
            if res.status != "pass":
                for detail in res.details:
                    priority = "high" if res.status == "fail" else "medium"
                    remediation_plan.append(RemediationStep(
                        issue=f"[{validator.name}] {detail}",
                        action="Please review and correct data input.",
                        priority=priority
                    ))

        # Normalize score
        normalized_score = total_risk_score / total_weight if total_weight > 0 else 0
        
        # Determine Overall Status
        if normalized_score > 5.0:
            status = "non_compliant"
        elif normalized_score > 1.0:
            status = "requires_review"
        else:
            status = "compliant"

        return ComplianceAudit(
            valuation_id=valuation_id,
            timestamp=datetime.now(),
            overall_risk_score=round(normalized_score, 2),
            compliance_status=status,
            results=results,
            remediation_plan=remediation_plan
        )
