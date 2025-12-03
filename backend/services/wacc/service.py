import os
from backend.services.financial_data.factory import FinancialDataFactory
from backend.calculations.models import MarketAssumptions

class WaccCalculatorService:
    def __init__(self):
        self.provider = FinancialDataFactory.get_provider()
        self.default_mrp = float(os.getenv("DEFAULT_MARKET_RISK_PREMIUM", 0.055))

    def get_market_data(self, ticker: str) -> MarketAssumptions:
        """
        Get market assumptions for a ticker, including WACC calculation.
        """
        # 1. Fetch Market Data
        beta = self.provider.get_company_beta(ticker)
        rf_rate = self.provider.get_treasury_yield()
        
        # 2. Fetch Financials for Cost of Debt & Capital Structure
        # We need Interest Expense and Total Debt.
        # Since get_financials returns a HistoricalFinancials object which might not have raw debt/interest,
        # we might need to rely on the provider's mapping or fetch raw data if possible.
        # For now, let's use the get_financials and see what we have.
        # HistoricalFinancials has: revenue, ebitda, ebit, net_income, capex, nwc.
        # It DOES NOT have Interest Expense or Total Debt explicitly in the standardized model yet.
        # We should probably update the HistoricalFinancials model or the Provider to return these.
        
        # For this iteration, let's assume we can get a "best estimate" or we need to extend the model.
        # Let's extend the logic to try to estimate Kd.
        
        # Fallback Kd if we can't calculate
        kd = rf_rate + 0.02 
        
        # Calculate Cost of Equity
        ke = rf_rate + beta * self.default_mrp
        
        # WACC (Simplified 60/40 if no capital structure data)
        # In a real app, we'd fetch Balance Sheet for Debt and Market Cap for Equity.
        equity_weight = 0.60
        debt_weight = 0.40
        tax_rate = 0.21
        
        wacc = equity_weight * ke + debt_weight * kd * (1 - tax_rate)
        
        return MarketAssumptions(
            risk_free_rate=rf_rate,
            beta=beta,
            market_risk_premium=self.default_mrp,
            cost_of_debt=kd,
            cost_of_equity=ke,
            wacc=wacc
        )
