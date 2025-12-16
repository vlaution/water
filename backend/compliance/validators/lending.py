from typing import Dict, Any
from backend.compliance.validators.base import BaseValidator
from backend.models.compliance import ComplianceResult

class LendingComplianceValidator(BaseValidator):
    """
    Checks for compliance with Interagency Guidance on Leveraged Lending (and common covenants).
    Focuses on:
    1. Leverage Ratio (Total Debt / EBITDA) > 6.0x (Regulatory Warning)
    2. Interest Coverage Ratio < 2.0x (Covenant Risk)
    3. Disclosure of Financing Terms
    """
    
    @property
    def name(self) -> str:
        return "Lending & Covenant Compliance"

    @property
    def weight(self) -> float:
        return 1.5 # Medium-High impact

    def validate(self, valuation_data: Dict[str, Any]) -> ComplianceResult:
        details = []
        risk_score = 0.0
        status = "pass"
        
        # Extract LBO Inputs
        # Assuming valuation_data structure mimics what ValuationEngine produces
        # or simplified inputs.
        
        inputs = valuation_data.get("inputs", {})
        results = valuation_data.get("results", {})
        
        total_debt = inputs.get("total_debt") or results.get("total_debt")
        ebitda = inputs.get("ebitda") or results.get("ebitda")
        interest_expense = results.get("interest_expense")
        
        # 1. Leverage Check
        if total_debt is not None and ebitda is not None and ebitda > 0:
            leverage = total_debt / ebitda
            if leverage > 6.0:
                details.append(f"High Leverage Detected: {leverage:.2f}x > 6.0x (Exceeds Interagency Guidance).")
                risk_score += 4.0
                status = "at_risk"
            else:
                details.append(f"Leverage Ratio: {leverage:.2f}x (Acceptable).")
        else:
            # If not LBO or missing data, might skip or warn
            if valuation_data.get("methodology") == "LBO":
                details.append("LBO Missing critical debt/EBITDA inputs.")
                risk_score += 1.0
        
        # 2. Interest Coverage Check
        if ebitda is not None and interest_expense is not None and interest_expense > 0:
            coverage = ebitda / interest_expense
            if coverage < 2.0:
                 details.append(f"CRITICAL: Interest Coverage {coverage:.2f}x < 2.0x (Potential Covenant Breach).")
                 risk_score += 7.0 # Immediate Fail (Threshold is 6.0)
                 status = "fail"
            else:
                details.append(f"Interest Coverage: {coverage:.2f}x (Healthy).")
                
        # 3. Disclosure Check
        terms = valuation_data.get("financing_terms_text")
        if not terms or len(terms) < 10:
             if valuation_data.get("methodology") == "LBO":
                 details.append("Missing detailed disclosure of financing terms.")
                 risk_score += 2.0
                 if status != "fail": status = "at_risk"

        if risk_score > 6.0:
            status = "fail"
        elif risk_score > 0.0:
            status = "at_risk"
            
        return self._create_result(status, risk_score, details)
