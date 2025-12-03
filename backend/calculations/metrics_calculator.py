from typing import Optional, List
import numpy as np
from backend.calculations.models import HistoricalFinancials
from backend.calculations.benchmarking_models import CompanyMetrics

class MetricsCalculator:
    @staticmethod
    def calculate_metrics(financials: HistoricalFinancials, ticker: str) -> CompanyMetrics:
        """
        Calculates financial metrics for the latest available period (usually LTM or last FY).
        """
        if not financials.years:
            return CompanyMetrics(ticker=ticker)

        # Helper to safely get the first element (latest year)
        def get_latest(data_list: Optional[List[float]]) -> float:
            return data_list[0] if data_list and len(data_list) > 0 else 0.0

        # Helper for growth calculation (CAGR)
        def calculate_cagr(data_list: Optional[List[float]], years: int = 3) -> Optional[float]:
            if not data_list or len(data_list) < 2:
                return None
            
            # Use available years if less than requested
            n = min(len(data_list) - 1, years)
            if n < 1: 
                return None
                
            start_val = data_list[n]
            end_val = data_list[0]
            
            if start_val <= 0 or end_val <= 0:
                return None # CAGR undefined for negative/zero start/end
                
            return (end_val / start_val) ** (1 / n) - 1

        # Extract latest values
        revenue = get_latest(financials.revenue)
        ebitda = get_latest(financials.ebitda)
        ebit = get_latest(financials.ebit)
        net_income = get_latest(financials.net_income)
        
        total_assets = get_latest(financials.total_assets)
        total_equity = get_latest(financials.total_equity)
        total_debt = get_latest(financials.total_debt)
        current_assets = get_latest(financials.current_assets)
        current_liabilities = get_latest(financials.current_liabilities)
        cash = get_latest(financials.cash_and_equivalents)
        inventory = get_latest(financials.inventory)
        receivables = get_latest(financials.receivables)
        
        metrics = CompanyMetrics(ticker=ticker, period=str(financials.years[0]))

        # --- Profitability ---
        if total_equity > 0:
            metrics.roe = net_income / total_equity
        if total_assets > 0:
            metrics.roa = net_income / total_assets
        if revenue > 0:
            metrics.net_margin = net_income / revenue
            metrics.ebitda_margin = ebitda / revenue
            metrics.operating_margin = ebit / revenue
            # Gross margin requires Gross Profit which we might not have explicitly, 
            # but usually Revenue - Cost of Revenue. 
            # If we don't have COGS, we skip Gross Margin or approximate if possible.
            # For now, let's skip if not available.

        # --- Liquidity ---
        if current_liabilities > 0:
            metrics.current_ratio = current_assets / current_liabilities
            metrics.quick_ratio = (current_assets - inventory) / current_liabilities
            metrics.cash_ratio = cash / current_liabilities

        # --- Leverage ---
        if total_equity > 0:
            metrics.debt_to_equity = total_debt / total_equity
        if total_assets > 0:
            metrics.debt_to_assets = total_debt / total_assets
        if ebitda > 0:
            metrics.net_debt_to_ebitda = (total_debt - cash) / ebitda
        
        # Interest Coverage requires Interest Expense. 
        # We didn't add Interest Expense to HistoricalFinancials yet.
        # Let's skip for now or add it.

        # --- Efficiency ---
        if total_assets > 0:
            metrics.asset_turnover = revenue / total_assets
        if inventory > 0:
            metrics.inventory_turnover = revenue / inventory # Approximation (usually COGS / Avg Inv)
        if receivables > 0:
            metrics.receivables_turnover = revenue / receivables

        # --- Growth ---
        metrics.revenue_growth = calculate_cagr(financials.revenue, 3)
        metrics.ebitda_growth = calculate_cagr(financials.ebitda, 3)
        metrics.net_income_growth = calculate_cagr(financials.net_income, 3)

        return metrics
