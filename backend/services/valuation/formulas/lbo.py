from backend.calculations.models import LBOInput
import numpy as np

class LBOCalculator:
    @staticmethod
    def calculate(lbo_input: LBOInput) -> float:
        if not lbo_input:
            return 0.0
        
        # Entry valuation
        entry_ev = lbo_input.entry_ebitda * lbo_input.entry_ev_ebitda_multiple
        
        # Financing structure
        debt = entry_ev * lbo_input.debt_percentage
        equity_investment = entry_ev * (1 - lbo_input.debt_percentage)
        
        # Project financials over holding period
        current_revenue = lbo_input.entry_revenue
        
        for year in range(lbo_input.holding_period):
            # Revenue growth
            current_revenue *= (1 + lbo_input.revenue_growth_rate)
            
            # EBITDA
            ebitda = current_revenue * lbo_input.ebitda_margin
            
            # Cash flow available for debt paydown
            interest_expense = debt * lbo_input.debt_interest_rate
            capex = current_revenue * lbo_input.capex_percentage
            delta_nwc = current_revenue * lbo_input.nwc_percentage * lbo_input.revenue_growth_rate
            
            fcf = ebitda - interest_expense - capex - delta_nwc
            
            # Debt paydown (use excess cash flow)
            debt_paydown = max(0, fcf * 0.5)
            debt = max(0, debt - debt_paydown)
        
        # Exit valuation
        exit_ebitda = current_revenue * lbo_input.ebitda_margin
        exit_ev = exit_ebitda * lbo_input.exit_ev_ebitda_multiple
        
        # Proceeds to equity
        equity_proceeds = exit_ev - debt
        
        try:
            cf_array = [-equity_investment] + [0] * (lbo_input.holding_period - 1) + [equity_proceeds]
            # irr = np.irr(cf_array) # np.irr is deprecated, use numpy_financial.irr if available, or keep using it if it works in this env
            # For now, we just return entry EV as per original code structure, but ideally we'd return IRR too.
            # The original code returned entry_ev * 1000000
            
            return entry_ev * 1000000
            
        except:
            return entry_ev * 1000000
