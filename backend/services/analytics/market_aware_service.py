from typing import Dict, Any, List
from pydantic import BaseModel

class MarketScenario(BaseModel):
    description: str
    rates: Dict[str, float]
    multiples_adjustment: float
    growth_adjustment: float

class SectorMultiples(BaseModel):
    senior_leverage: float
    total_leverage: float
    equity_contribution_percent: float

class DebtStructureAdvice(BaseModel):
    market_condition_adjustment: float
    suggested_structure: Dict[str, Any]
    warnings: List[str]

class MarketAwareService:
    def get_market_scenarios(self) -> Dict[str, Any]:
        """
        Returns standard market scenarios for sensitivity analysis.
        """
        base_rates = {
            "risk_free_rate": 0.045,
            "senior_debt_rate": 0.08,
            "mezzanine_debt_rate": 0.12,
            "preferred_equity_rate": 0.15
        }
        
        return {
            "Current": {
                "description": "Current market conditions",
                "rates": base_rates,
                "multiples_adjustment": 0.0,
                "growth_adjustment": 0.0
            },
            "Bull Case": {
                "description": "Optimistic market: Lower rates, higher multiples",
                "rates": {k: v - 0.01 for k, v in base_rates.items()},
                "multiples_adjustment": 1.5,
                "growth_adjustment": 0.02
            },
            "Bear Case": {
                "description": "Pessimistic market: Higher rates, lower multiples",
                "rates": {k: v + 0.015 for k, v in base_rates.items()},
                "multiples_adjustment": -2.0,
                "growth_adjustment": -0.02
            },
            "High Inflation": {
                "description": "High rates environment",
                "rates": {k: v + 0.03 for k, v in base_rates.items()},
                "multiples_adjustment": -1.0,
                "growth_adjustment": 0.01 # Nominal growth up
            }
        }

    def get_leverage_multiples(self, sector: str) -> SectorMultiples:
        """
        Returns typical leverage stats for a sector.
        """
        # Mock data - in real app would come from DB/API
        sector_data = {
            "Technology": {"senior": 3.0, "total": 5.0, "equity": 0.45},
            "Healthcare": {"senior": 4.0, "total": 6.0, "equity": 0.40},
            "Industrials": {"senior": 3.5, "total": 5.5, "equity": 0.40},
            "Consumer": {"senior": 3.0, "total": 4.5, "equity": 0.50},
            "Energy": {"senior": 2.5, "total": 4.0, "equity": 0.55}
        }
        
        data = sector_data.get(sector, {"senior": 3.0, "total": 4.5, "equity": 0.50})
        
        return SectorMultiples(
            senior_leverage=data["senior"],
            total_leverage=data["total"],
            equity_contribution_percent=data["equity"]
        )

    def get_debt_structure_advice(self, sector: str, ebitda: float) -> DebtStructureAdvice:
        """
        Returns recommended debt structure based on sector and size.
        """
        warnings = []
        market_adj = 0.0
        
        # Size-based logic
        if ebitda < 10_000_000:
            warnings.append("Small EBITDA may limit access to syndicated debt markets.")
            market_adj = -0.5 # Lower leverage for small deals
        
        # Sector logic
        if sector == "Technology":
            senior_lev = 3.0
            mezz_lev = 1.0
        elif sector == "Healthcare":
            senior_lev = 4.0
            mezz_lev = 1.5
        else:
            senior_lev = 3.0
            mezz_lev = 1.5
            
        return DebtStructureAdvice(
            market_condition_adjustment=market_adj,
            suggested_structure={
                "senior_debt": {
                    "leverage": max(0, senior_lev + market_adj),
                    "interest_rate": 0.08,
                    "term_years": 5
                },
                "mezzanine_debt": {
                    "leverage": max(0, mezz_lev),
                    "interest_rate": 0.12,
                    "term_years": 7
                }
            },
            warnings=warnings
        )

market_aware_service = MarketAwareService()
