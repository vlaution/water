from typing import Dict, Any
from backend.compliance.validators.base import BaseValidator
from backend.models.compliance import ComplianceResult

class ASC820Validator(BaseValidator):
    """
    Checks for ASC 820 (Fair Value Measurements) compliance.
    Focuses on:
    1. Hierarchy Level classification (Level 1, 2, 3)
    2. Observable inputs for Level 2
    3. Unobservable input documentation for Level 3
    """
    
    @property
    def name(self) -> str:
        return "ASC 820 Fair Value"

    @property
    def weight(self) -> float:
        return 2.0 # High impact

    def validate(self, valuation_data: Dict[str, Any]) -> ComplianceResult:
        details = []
        risk_score = 0.0
        status = "pass"
        
        # 1. Check if Validation Level is defined
        fv_level = valuation_data.get("fair_value_level")
        if not fv_level:
            details.append("Fair Value Hierarchy Level is NOT defined.")
            risk_score += 5.0
            status = "fail"
        else:
            details.append(f"Classified as Level {fv_level}.")
            
            # 2. Check for Level 3 Support
            if str(fv_level) == "3":
                inputs = valuation_data.get("inputs", {})
                if not inputs.get("unobservable_inputs_doc"):
                    details.append("Level 3 inputs missing documentation (ASC 820-10-50).")
                    risk_score += 3.0
                    status = "at_risk"
        
        # 3. Check for Market Participant Assumptions
        if not valuation_data.get("market_participant_assumptions_verified"):
             details.append("Market participant assumptions verification missing.")
             risk_score += 1.0

        # 4. Level 1 Evidence Check (Market Intelligence)
        ticker = valuation_data.get("company_ticker")
        if ticker:
            try:
                # Lazy import to avoid circular dep if any
                from backend.services.financial_data.alpha_vantage import AlphaVantageProvider
                provider = AlphaVantageProvider()
                price = provider.get_real_time_price(ticker)
                
                if price and price > 0:
                    details.append(f"Traceable Level 1 Market Data found for {ticker} (${price}).")
                    
                    if str(fv_level) != "1":
                        details.append(f"WARNING: Active market Level 1 price exists. Justification required for Level {fv_level}.")
                        risk_score += 2.0
                        status = "at_risk"
            except Exception as e:
                # Fails silently if API key invalid or network issue, ensuring robust validation
                pass
        
        if risk_score > 6.0:
            status = "fail"
        elif risk_score > 0.0:
            status = "at_risk"
            
        return self._create_result(status, risk_score, details)
