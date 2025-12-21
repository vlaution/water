
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class WorkingCapitalAssumptions:
    dso: float = 45.0
    dio: float = 60.0
    dpo: float = 30.0

@dataclass
class ProjectionAssumptions:
    revenue_growth_start: float
    revenue_growth_end: float
    ebitda_margin_start: float
    ebitda_margin_end: float
    tax_rate: float
    discount_rate: float
    terminal_growth_rate: float
    terminal_exit_multiple: Optional[float] = None
    depreciation_rate: float = 0.03
    capex_percent_revenue: Optional[float] = None
    working_capital: Optional[WorkingCapitalAssumptions] = None

@dataclass
class HistoricalFinancials:
    revenue: List[float]

@dataclass
class DCFInput:
    historical: HistoricalFinancials
    projections: ProjectionAssumptions
    net_debt: float
    shares_outstanding: float

class DCFCalculator:
    @staticmethod
    def calculate(dcf_input: DCFInput):
        proj = dcf_input.projections
        hist = dcf_input.historical
        
        last_revenue = hist.revenue[-1]
        projected_cash_flows = []
        current_revenue = last_revenue
        
        # Working Capital Init
        # Simplified as per dcf.py "else" block if wc is None, 
        # But wait, dcf.py had an "if proj.working_capital" block.
        # I will assume None for simplicity unless user provided (they didn't).
        # dcf.py fallback:
        # prev_nwc = 0 (Line 27)
        prev_nwc = 0
            
        # print(f"\n--- Calculating for Revenue Base: ${last_revenue:,.0f} ---")

        for year in range(5):
            # 1. Revenue
            # Line 31: growth_rate = start + (end - start) * (year / 4)
            growth_rate = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (year / 4.0)
            current_revenue *= (1 + growth_rate)
            
            # 2. EBITDA
            # Line 35: margin = start + (end - start) * (year / 4)
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (year / 4.0)
            ebitda = current_revenue * margin
            
            # 3. Depreciation & EBIT
            depreciation = current_revenue * proj.depreciation_rate # 0.03 default
            ebit = ebitda - depreciation
            
            # 4. Tax & NOPAT
            tax = max(0, ebit * proj.tax_rate)
            nopat = ebit - tax
            
            # 5. Working Capital (Fallback logic from dcf.py)
            # Line 56: nwc = current_revenue * 0.05
            # Line 57: change_in_nwc = nwc - (current_revenue / (1+growth_rate) * 0.05)
            # Wait, Line 57 logic in dcf.py calculates change from implied prev nwc?
            # Actually Line 57 seems to try to calc "Previous Revenue * 0.05" on the fly?
            # Let's stick strictly to dcf.py logic.
            nwc = current_revenue * 0.05
            # dcf.py Line 57: change_in_nwc = nwc - (current_revenue / (1+growth_rate) * 0.05)
            # This logic assumes prev_nwc was (Current / (1+g)) * 0.05. 
            # This ignores the actual prev_nwc tracked in variable?
            # In dcf.py lines 47-54 track prev_nwc.
            # In "else" block (lines 56-57), it doesn't update prev_nwc variable?
            # Yes, lines 56-57 are:
            # nwc = current_revenue * 0.05
            # change_in_nwc = nwc - (current_revenue / (1+growth_rate) * 0.05)
            change_in_nwc = nwc - (current_revenue / (1 + growth_rate) * 0.05)
            
            # 6. CapEx
            # Line 63: capex = depreciation * 1.1 (if percent_revenue is None)
            capex = depreciation * 1.1
            
            # 7. FCFF
            fcff = nopat + depreciation - capex - change_in_nwc
            projected_cash_flows.append(fcff)
            
            # print(f"Year {year+1}: Rev=${current_revenue:,.0f}, Growth={growth_rate:.1%}, EBITDA=${ebitda:,.0f} ({margin:.1%}), FCFF=${fcff:,.0f}")

        # Terminal Value
        # Line 70
        terminal_cash_flow = projected_cash_flows[-1] * (1 + proj.terminal_growth_rate)
        tv_ggm = terminal_cash_flow / (proj.discount_rate - proj.terminal_growth_rate)
        
        terminal_value = tv_ggm
        # print(f"Terminal Value (GGM): ${terminal_value:,.0f}")
        
        # Discounting
        dcf_value = 0
        for i, cf in enumerate(projected_cash_flows):
            # Mid-year: (i + 0.5)
            factor = (1 + proj.discount_rate) ** (i + 0.5)
            pv = cf / factor
            dcf_value += pv
            
        pv_terminal = terminal_value / ((1 + proj.discount_rate) ** 5) # Line 87
        dcf_value += pv_terminal
        
        return dcf_value

# --- Scenarios ---

# 1. Mature Company
mature_input = DCFInput(
    historical=HistoricalFinancials(revenue=[50_000_000_000]), # $50B
    projections=ProjectionAssumptions(
        revenue_growth_start=0.04,  # 4%
        revenue_growth_end=0.02,    # 2% (Terminal Growth from table used as decay target?)
                                    # Table says: "Revenue Growth (Terminal): 2.0%"
        ebitda_margin_start=0.30,   # 30%
        ebitda_margin_end=0.30,     # 30% "EBITDA Margin (Terminal)"
        tax_rate=0.23,              # 23%
        discount_rate=0.08,         # 8%
        terminal_growth_rate=0.02,  # 2.0%
    ),
    shares_outstanding=100_000_000,
    net_debt=500_000_000
)

# 2. High-Growth Company
# Assumption: $100M Base Revenue
growth_input = DCFInput(
    historical=HistoricalFinancials(revenue=[100_000_000]), # $100M
    projections=ProjectionAssumptions(
        revenue_growth_start=0.375, # 37.5%
        revenue_growth_end=0.025,   # 2.5%
        ebitda_margin_start=0.10,   # 10%
        ebitda_margin_end=0.25,     # 25%
        tax_rate=0.23,              # 23%
        discount_rate=0.125,        # 12.5%
        terminal_growth_rate=0.025, # 2.5%
    ),
    shares_outstanding=50_000_000,
    net_debt=25_000_000
)


print("-" * 30)
print(f"MATURE COMPANY (Based on $50B Revenue)")
ev_mature = DCFCalculator.calculate(mature_input)
print(f"Enterprise Value: ${ev_mature:,.0f}")

print("\n")
print(f"HIGH-GROWTH COMPANY (Based on $100M Revenue [Assumption])")
ev_growth = DCFCalculator.calculate(growth_input)
print(f"Enterprise Value: ${ev_growth:,.0f}")
print("-" * 30)

