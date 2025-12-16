from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class ComplianceResult(BaseModel):
    """Result of a single validator run."""
    validator_name: str
    status: str # "pass", "fail", "at_risk"
    risk_score: float # 0.0 to 10.0
    details: List[str]
    weight: float = 1.0

class RemediationStep(BaseModel):
    """Actionable step to fix a compliance issue."""
    issue: str
    action: str
    priority: str # "high", "medium", "low"

class ComplianceAudit(BaseModel):
    """Comprehensive audit result."""
    valuation_id: str
    timestamp: datetime
    overall_risk_score: float
    compliance_status: str # "compliant", "non_compliant", "requires_review"
    results: Dict[str, ComplianceResult]
    remediation_plan: List[RemediationStep]
