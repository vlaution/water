from typing import Dict, Any, List
from pydantic import BaseModel
import random

class DebtMarketConditions(BaseModel):
    senior_rate: float
    mezzanine_rate: float
    high_yield_rate: float
    pik_percent: float
    leverage_limit: float # Total Debt / EBITDA
    interest_coverage_min: float
    cash_sweep_percent: float

class DebtMarketService:
    def __init__(self):
        # In a real app, this would fetch from Bloomberg/Capital IQ/FRED
        pass

    def get_current_conditions(self) -> DebtMarketConditions:
        """
        Get current market conditions for debt financing.
        Returns rates and covenant trends.
        """
        # Base rates (e.g. SOFR ~ 5.3%)
        sofr = 5.3
        
        # Spreads (bps)
        senior_spread = 275 # 2.75%
        mezz_spread = 700   # 7.00%
        hy_yield = 9.5      # Fixed yield
        
        return DebtMarketConditions(
            senior_rate=round(sofr + (senior_spread / 100), 2),
            mezzanine_rate=round(sofr + (mezz_spread / 100), 2),
            high_yield_rate=hy_yield,
            pik_percent=5.0,
            leverage_limit=5.0, # 5.0x EBITDA
            interest_coverage_min=2.5,
            cash_sweep_percent=50.0
        )

    def get_historical_trends(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical trend of Senior Debt rates for charting.
        """
        trends = []
        base_rate = 8.0
        for i in range(days):
            # Random walk
            base_rate += random.uniform(-0.05, 0.05)
            trends.append({
                "day": i,
                "rate": round(base_rate, 2)
            })
        return trends

debt_market_service = DebtMarketService()
