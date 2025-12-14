from typing import Tuple, List, Dict, Any
from backend.calculations.models import DCFInput

class DCFCalculator:
    @staticmethod
    def calculate(dcf_input: DCFInput) -> Tuple[float, List[float], Dict[str, Any]]:
        if not dcf_input:
            return 0.0, [], {}
            
        proj = dcf_input.projections
        hist = dcf_input.historical
        
        # Simple projection for 5 years
        last_revenue = hist.revenue[-1]
        projected_cash_flows = []
        
        current_revenue = last_revenue
        
        # Initialize previous WC for change calculation
        if proj.working_capital:
            prev_ar = (last_revenue / 365) * proj.working_capital.dso
            proxy_cogs = last_revenue * 0.6 
            prev_inv = (proxy_cogs / 365) * proj.working_capital.dio
            prev_ap = (proxy_cogs / 365) * proj.working_capital.dpo
            prev_nwc = prev_ar + prev_inv - prev_ap
        else:
            prev_nwc = 0 
            
        for year in range(5):
            # 1. Revenue
            growth_rate = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (year / 4)
            current_revenue *= (1 + growth_rate)
            
            # 2. EBITDA
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (year / 4)
            ebitda = current_revenue * margin
            
            # 3. Depreciation & EBIT
            depreciation = current_revenue * proj.depreciation_rate
            ebit = ebitda - depreciation
            
            # 4. Tax & NOPAT
            tax = max(0, ebit * proj.tax_rate)
            nopat = ebit - tax
            
            # 5. Working Capital
            if proj.working_capital:
                ar = (current_revenue / 365) * proj.working_capital.dso
                proxy_cogs = current_revenue * 0.6
                inv = (proxy_cogs / 365) * proj.working_capital.dio
                ap = (proxy_cogs / 365) * proj.working_capital.dpo
                nwc = ar + inv - ap
                change_in_nwc = nwc - prev_nwc
                prev_nwc = nwc
            else:
                nwc = current_revenue * 0.05
                change_in_nwc = nwc - (current_revenue / (1+growth_rate) * 0.05)
            
            # 6. CapEx
            if proj.capex_percent_revenue is not None:
                capex = current_revenue * proj.capex_percent_revenue
            else:
                capex = depreciation * 1.1
            
            # 7. FCFF
            fcff = nopat + depreciation - capex - change_in_nwc
            projected_cash_flows.append(fcff)
            
        # Terminal Value
        terminal_cash_flow = projected_cash_flows[-1] * (1 + proj.terminal_growth_rate)
        tv_ggm = terminal_cash_flow / (proj.discount_rate - proj.terminal_growth_rate)
        
        tv_multiple = 0
        if proj.terminal_exit_multiple:
            terminal_ebitda = ebitda 
            tv_multiple = terminal_ebitda * proj.terminal_exit_multiple
            
        terminal_value = tv_multiple if proj.terminal_exit_multiple else tv_ggm
        
        # Discounting (Mid-Year Convention)
        dcf_value = 0
        for i, cf in enumerate(projected_cash_flows):
            # Mid-year convention: Discount factor is (i + 0.5)
            dcf_value += cf / ((1 + proj.discount_rate) ** (i + 0.5))
            
        # Terminal Value is at end of year 5, so discount by 5 years
        dcf_value += terminal_value / ((1 + proj.discount_rate) ** 5)
        
        return dcf_value, projected_cash_flows, {
            "revenue": [last_revenue * (1 + proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4)) for i in range(5)],
            "ebitda": [
                (last_revenue * (1 + proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4))) * 
                (proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (i / 4))
                for i in range(5)
            ],
            "fcff": projected_cash_flows,
            "balance_sheet": {
                "cash": [cf * 0.1 for cf in projected_cash_flows],
                "working_capital": [cf * 0.05 for cf in projected_cash_flows],
                "ppe": [cf * 2.0 for cf in projected_cash_flows],
                "debt": [dcf_input.net_debt * (0.9 ** i) for i in range(5)],
                "equity": [dcf_value * (1.05 ** i) for i in range(5)]
            }
        }
