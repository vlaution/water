from typing import Dict, Any
from backend.compliance.validators.base import BaseValidator
from backend.models.compliance import ComplianceResult

class SOX404Validator(BaseValidator):
    """
    Checks for SOX 404 (Internal Controls) compliance.
    Focuses on:
    1. Maker/Checker separation (Reviewer != Creator)
    2. Change Management (Audit trail exists)
    """
    
    @property
    def name(self) -> str:
        return "SOX 404 IT Controls"

    @property
    def weight(self) -> float:
        return 1.5

    def validate(self, valuation_data: Dict[str, Any]) -> ComplianceResult:
        details = []
        risk_score = 0.0
        status = "pass"
        
        meta = valuation_data.get("metadata", {})
        
        # 1. Check Segregation of Duties
        creator = meta.get("created_by")
        reviewer = meta.get("reviewed_by")
        
        if not reviewer:
            details.append("No reviewer assigned. Segregation of duties at risk.")
            risk_score += 4.0
            status = "at_risk"
        elif creator == reviewer:
            details.append(f"Creator ({creator}) cannot be the Reviewer.")
            risk_score += 8.0
            status = "fail"
            
        # 2. Check for Approval Timestamp
        if not meta.get("approved_at"):
             details.append("Missing final approval timestamp.")
             risk_score += 2.0
        
        if risk_score > 5.0:
            status = "fail"
        elif risk_score > 0.0:
            status = "at_risk"

        return self._create_result(status, risk_score, details)
