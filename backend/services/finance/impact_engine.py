from typing import Dict, Any, List

class ImpactEstimationEngine:
    """
    Calculates the financial impact of changing assumptions.
    Uses a simplified DCF model to estimate Enterprise Value (EV) changes.
    """

    def calculate_impact(self, current_assumptions: Dict[str, float], suggested_assumptions: Dict[str, float], revenue_base: float = 100.0) -> Dict[str, Any]:
        """
        Calculates the valuation impact of moving from current to suggested assumptions.
        
        Args:
            current_assumptions: Dict with keys like 'revenue_growth', 'ebitda_margin', 'wacc', 'terminal_growth'
            suggested_assumptions: Dict with same keys, containing new values.
            revenue_base: Starting revenue for the projection (default 100 for relative % calculation).

        Returns:
            Dict containing valuation change percentage, absolute values, and key drivers.
        """
        
        # 1. Calculate Current EV
        current_ev = self._simple_dcf(
            revenue_base,
            current_assumptions.get('revenue_growth', 0.10),
            current_assumptions.get('ebitda_margin', 0.20),
            current_assumptions.get('wacc', 0.12),
            current_assumptions.get('terminal_growth', 0.03)
        )

        # 2. Calculate Suggested EV
        suggested_ev = self._simple_dcf(
            revenue_base,
            suggested_assumptions.get('revenue_growth', 0.10),
            suggested_assumptions.get('ebitda_margin', 0.20),
            suggested_assumptions.get('wacc', 0.12),
            suggested_assumptions.get('terminal_growth', 0.03)
        )

        # 3. Calculate Delta
        if current_ev == 0:
            pct_change = 0.0
        else:
            pct_change = (suggested_ev - current_ev) / current_ev

        return {
            "valuation_change_pct": round(pct_change, 4),
            "enterprise_value_current": round(current_ev, 2),
            "enterprise_value_suggested": round(suggested_ev, 2),
            "is_material": abs(pct_change) > 0.10  # >10% threshold
        }

    def _simple_dcf(self, start_revenue: float, growth_rate: float, margin: float, wacc: float, terminal_growth: float, projection_years: int = 5) -> float:
        """
        Performs a simplified 5-year DCF calculation.
        """
        # Safety checks
        if wacc <= terminal_growth:
            wacc = terminal_growth + 0.01 # Prevent division by zero or negative denominator
        
        present_value_sum = 0.0
        current_revenue = start_revenue

        # Projection Period
        for year in range(1, projection_years + 1):
            current_revenue *= (1 + growth_rate)
            ebitda = current_revenue * margin
            # Assume Free Cash Flow conversion is roughly EBITDA for this simplified model (or apply a tax/capex factor if needed)
            # For simplicity in "Impact Estimation", we use EBITDA as proxy for FCF or apply a standard conversion
            fcf = ebitda * 0.7 # 30% tax/capex/working capital proxy
            
            discount_factor = 1 / ((1 + wacc) ** year)
            present_value_sum += fcf * discount_factor

        # Terminal Value
        terminal_fcf = (current_revenue * (1 + terminal_growth)) * margin * 0.7
        terminal_value = terminal_fcf / (wacc - terminal_growth)
        terminal_value_pv = terminal_value / ((1 + wacc) ** projection_years)

        return present_value_sum + terminal_value_pv
