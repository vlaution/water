import os
import requests
from typing import Optional, Dict, Any
from backend.services.financial_data.provider import FinancialDataProvider
from backend.calculations.models import HistoricalFinancials, MarketAssumptions

from backend.services.financial_data.cache import cache
from backend.calculations.metrics_calculator import MetricsCalculator

class AlphaVantageProvider(FinancialDataProvider):
    """
    Concrete implementation of FinancialDataProvider using Alpha Vantage API.
    """
    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self):
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if not self.api_key:
            # Fallback for demo purposes if not set, though ideally should be required
            print("WARNING: ALPHA_VANTAGE_API_KEY not found. Using 'demo' key which only works for IBM.")
            self.api_key = "demo"

    def _make_request(self, function: str, symbol: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        # Generate cache key
        key_parts = [function, symbol or ""]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}={v}")
        cache_key = f"av_api:{':'.join(key_parts)}"
        
        # Check cache
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        params = {
            "function": function,
            "apikey": self.api_key,
            **kwargs
        }
        if symbol:
            params["symbol"] = symbol
        
        try:
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "Error Message" in data:
                raise ValueError(f"Alpha Vantage API Error: {data['Error Message']}")
            if "Note" in data:
                # API limit reached
                raise ValueError("Alpha Vantage API Limit Reached")
            
            # Cache success response
            cache.set(cache_key, data)
                
            return data
        except requests.RequestException as e:
            raise ConnectionError(f"Failed to connect to Alpha Vantage: {str(e)}")

    def get_financials(self, ticker: str) -> HistoricalFinancials:
        # Fetch Income Statement
        income_data = self._make_request("INCOME_STATEMENT", symbol=ticker)
        # Fetch Balance Sheet
        balance_data = self._make_request("BALANCE_SHEET", symbol=ticker)
        # Fetch Cash Flow
        cash_flow_data = self._make_request("CASH_FLOW", symbol=ticker)
        # Fetch Company Overview for Profile
        overview_data = self._make_request("OVERVIEW", symbol=ticker)
        
        financials = self._map_to_financials(income_data, balance_data, cash_flow_data, overview_data)
        
        # Calculate and cache metrics
        metrics = MetricsCalculator.calculate_metrics(financials, ticker)
        financials.metrics = metrics
        
        # Cache metrics separately for benchmarking service
        if metrics:
            cache.set(f"metrics:{ticker}", metrics.dict())
            
        return financials

    def _map_to_financials(self, income_data: Dict, balance_data: Dict, cash_flow_data: Dict, overview_data: Dict = None) -> HistoricalFinancials:
        # Extract annual reports
        income_reports = income_data.get("annualReports", [])
        balance_reports = balance_data.get("annualReports", [])
        cash_flow_reports = cash_flow_data.get("annualReports", [])
        
        # Sort by fiscalDateEnding descending (should be already, but ensure)
        # We'll take top 5 years
        years = []
        revenue = []
        ebitda = []
        ebit = []
        net_income = []
        capex = []
        capex = []
        nwc = []
        
        # New fields for benchmarking
        total_assets = []
        total_equity = []
        total_debt = []
        current_assets = []
        current_liabilities = []
        cash_and_equivalents = []
        inventory = []
        receivables = []
        
        # Create lookup dicts by date for easier merging
        bs_map = {r["fiscalDateEnding"]: r for r in balance_reports}
        cf_map = {r["fiscalDateEnding"]: r for r in cash_flow_reports}
        
        for report in income_reports[:5]:
            date = report["fiscalDateEnding"]
            year = int(date.split("-")[0])
            
            # Income Statement Items
            rev = float(report.get("totalRevenue", 0) or 0)
            net_inc = float(report.get("netIncome", 0) or 0)
            ebit_val = float(report.get("ebit", 0) or 0)
            ebitda_val = float(report.get("ebitda", 0) or 0)
            
            # Cash Flow Items
            cf_report = cf_map.get(date, {})
            capex_val = float(cf_report.get("capitalExpenditures", 0) or 0)
            # Capex is usually negative in CF statement, but we want positive magnitude or consistent sign
            # In DCF model, capex is usually subtracted. Let's keep it as is (negative) or absolute?
            # Model usually expects positive value to subtract, or negative?
            # Let's check HistoricalFinancials usage. Usually it's just a value.
            # Let's store as absolute value for "Capex" magnitude, or follow convention.
            # Alpha Vantage returns negative for outflows.
            
            # Balance Sheet Items
            bs_report = bs_map.get(date, {})
            
            curr_assets_val = float(bs_report.get("totalCurrentAssets", 0) or 0)
            curr_liab_val = float(bs_report.get("totalCurrentLiabilities", 0) or 0)
            
            tot_assets_val = float(bs_report.get("totalAssets", 0) or 0)
            tot_equity_val = float(bs_report.get("totalShareholderEquity", 0) or 0)
            
            short_term_debt = float(bs_report.get("shortTermDebt", 0) or 0)
            long_term_debt = float(bs_report.get("longTermDebt", 0) or 0)
            tot_debt_val = short_term_debt + long_term_debt
            
            cash_val = float(bs_report.get("cashAndCashEquivalentsAtCarryingValue", 0) or 0)
            inv_val = float(bs_report.get("inventory", 0) or 0)
            rec_val = float(bs_report.get("currentNetReceivables", 0) or 0)
            
            nwc_val = curr_assets_val - curr_liab_val
            
            years.append(year)
            revenue.append(rev)
            ebitda.append(ebitda_val)
            ebit.append(ebit_val)
            net_income.append(net_inc)
            capex.append(abs(capex_val)) # Store as positive magnitude
            nwc.append(nwc_val)
            
            total_assets.append(tot_assets_val)
            total_equity.append(tot_equity_val)
            total_debt.append(tot_debt_val)
            current_assets.append(curr_assets_val)
            current_liabilities.append(curr_liab_val)
            cash_and_equivalents.append(cash_val)
            inventory.append(inv_val)
            receivables.append(rec_val)
            
        # Map Profile Data
        profile = {}
        if overview_data:
            profile = {
                "company_name": overview_data.get("Name"),
                "industry": overview_data.get("Industry"),
                "sector": overview_data.get("Sector"),
                "description": overview_data.get("Description"),
                "address": overview_data.get("Address"),
                "employees": int(overview_data.get("FullTimeEmployees", 0)) if overview_data.get("FullTimeEmployees", "0").isdigit() else None,
                "fiscal_year_end": overview_data.get("FiscalYearEnd")
            }

        return HistoricalFinancials(
            years=years,
            revenue=revenue,
            ebitda=ebitda,
            ebit=ebit,
            net_income=net_income,
            capex=capex,
            nwc=nwc,
            total_assets=total_assets,
            total_equity=total_equity,
            total_debt=total_debt,
            current_assets=current_assets,
            current_liabilities=current_liabilities,
            cash_and_equivalents=cash_and_equivalents,
            inventory=inventory,
            receivables=receivables,
            **profile
        )

    def get_company_beta(self, ticker: str) -> float:
        data = self._make_request("OVERVIEW", symbol=ticker)
        return float(data.get("Beta", 1.0) or 1.0)

    def get_treasury_yield(self) -> float:
        # Alpha Vantage has TREASURY_YIELD function
        data = self._make_request("TREASURY_YIELD", interval="monthly", maturity="10year")
        # Get latest data
        if "data" in data and len(data["data"]) > 0:
            return float(data["data"][0]["value"] or 0) / 100.0 # Convert percentage to decimal
        return 0.045 # Fallback 4.5%

    def get_market_assumptions(self, ticker: str) -> MarketAssumptions:
        # Deprecated: Logic moved to WaccCalculatorService
        raise NotImplementedError("Use WaccCalculatorService for market assumptions")

    def get_company_multiples(self, ticker: str) -> Dict[str, float]:
        """
        Calculate EV/Revenue and EV/EBITDA multiples for a company.
        """
        try:
            # 1. Get Market Cap and Shares
            overview = self._make_request("OVERVIEW", symbol=ticker)
            market_cap = float(overview.get("MarketCapitalization", 0) or 0)
            
            # 2. Get Debt and Cash (Balance Sheet)
            bs_data = self._make_request("BALANCE_SHEET", symbol=ticker)
            bs_reports = bs_data.get("annualReports", [])
            if not bs_reports:
                return {}
                
            latest_bs = bs_reports[0]
            short_term_debt = float(latest_bs.get("shortTermDebt", 0) or 0)
            long_term_debt = float(latest_bs.get("longTermDebt", 0) or 0)
            cash = float(latest_bs.get("cashAndCashEquivalentsAtCarryingValue", 0) or 0)
            
            total_debt = short_term_debt + long_term_debt
            net_debt = total_debt - cash
            
            enterprise_value = market_cap + net_debt
            
            # 3. Get Revenue and EBITDA (Income Statement)
            inc_data = self._make_request("INCOME_STATEMENT", symbol=ticker)
            inc_reports = inc_data.get("annualReports", [])
            if not inc_reports:
                return {}
                
            latest_inc = inc_reports[0]
            revenue = float(latest_inc.get("totalRevenue", 0) or 0)
            ebitda = float(latest_inc.get("ebitda", 0) or 0)
            
            # 4. Calculate Multiples
            ev_revenue = enterprise_value / revenue if revenue > 0 else 0
            ev_ebitda = enterprise_value / ebitda if ebitda > 0 else 0
            
            return {
                "ev_revenue": round(ev_revenue, 2),
                "ev_ebitda": round(ev_ebitda, 2),
                "market_cap": market_cap,
                "enterprise_value": enterprise_value
            }
        except Exception as e:
            print(f"Error calculating multiples for {ticker}: {e}")
            return {}
