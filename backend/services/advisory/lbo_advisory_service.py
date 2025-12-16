from typing import Dict, Any, Optional
from backend.services.financial_data.market_data_service import market_data_service

class LBOAdvisoryService:
    def suggest_debt_structure(self, sector: str, ebitda: float = 0) -> Dict[str, Any]:
        """
        Suggests an optimal debt structure based on sector and current market conditions.
        """
        # 1. Get Sector Multiples (Market Norms)
        multiples = market_data_service.fetch_leverage_multiples(sector)
        base_senior_lev = multiples["senior_leverage"]
        base_total_lev = multiples["total_leverage"]

        # 2. Get Current Rates (Market Cost)
        rates = market_data_service.fetch_interest_rates()
        senior_rate = rates["senior_debt_rate"]
        
        # 3. Apply Advisory Logic (Adjustments)
        # If rates are high (>6% senior), reduce leverage capacity by 0.5x-1.0x
        adjustment = 0.0
        if senior_rate > 0.08: # Very High
             adjustment = -1.0
        elif senior_rate > 0.06: # High
             adjustment = -0.5
             
        suggested_senior = max(2.0, base_senior_lev + adjustment)
        suggested_total = max(3.0, base_total_lev + adjustment)
        
        suggested_mezz = suggested_total - suggested_senior
        
        return {
            "sector": sector,
            "market_condition_adjustment": adjustment,
            "suggested_structure": {
                "senior_debt": {
                    "leverage": suggested_senior,
                    "interest_rate": rates["senior_debt_rate"],
                    "term_years": 7
                },
                "mezzanine_debt": {
                    "leverage": suggested_mezz,
                    "interest_rate": rates["mezzanine_debt_rate"],
                    "term_years": 8  # Subordinated usually longer
                }
            },
            "warnings": [] if adjustment == 0 else ["High interest rate environment detected. Leverage capacity reduced to maintain coverage."]
        }

lbo_advisory_service = LBOAdvisoryService()
