import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import backend.calculations.models as models
from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator

def generate_golden_data():
    # 1. Construct Deterministic Input
    financing = models.LBOFinancing(
        tranches=[
            models.DebtTranche(
                name="Senior Term Loan",
                leverage_multiple=4.0,
                interest_rate=0.05,
                cash_interest=True,
                amortization_rate=0.01,
                maturity=7
            ),
            models.DebtTranche(
                name="Mezzanine",
                leverage_multiple=1.0,
                interest_rate=0.12,
                cash_interest=False, # PIK
                amortization_rate=0.0,
                maturity=8
            )
        ],
        equity_contribution_percent=None
    )
    
    assumptions = models.LBOAssumptions(
        transaction_fees_percent=0.01,
        synergy_benefits=2.0, # 2M synergy
        hurdle_rate=0.08,
        carry_percent=0.20,
        catchup_active=True
    )
    
    tax_assumptions = models.TaxConfig(
        enable_nol=True,
        initial_nol_balance=5.0,
        nol_annual_limit=1.0,
        interest_deductibility_cap=0.30,
        step_up_percent=0.0,
        depreciation_years=15
    )
    
    lbo_input = models.LBOInput(
        solve_for=models.LBOSolverMode.ENTRY_PRICE,
        entry_revenue=100.0,
        entry_ebitda=20.0, # 20% margin
        entry_ev_ebitda_multiple=10.0,
        financing=financing,
        assumptions=assumptions,
        revenue_growth_rate=0.05,
        ebitda_margin=0.20,
        capex_percentage=0.02,
        nwc_percentage=0.10,
        tax_rate=0.25,
        holding_period=5,
        exit_ev_ebitda_multiple=10.0,
        tax_assumptions=tax_assumptions,
        include_sensitivity=True # Also verify sensitivity!
    )
    
    # 2. Run Calculation
    print("Running Python LBO...")
    #calculate returns tuple (implied_ev, results)
    implied_ev, results = EnhancedLBOCalculator.calculate(lbo_input)
    
    print(f"Calculated Returns: IRR={results.get('irr')}, MOIC={results.get('moic')}")
    
    # 3. Export
    output_data = {
        "input": lbo_input.dict(),
        "output": results
    }
    
    output_data_json = json.dumps(output_data, default=str, indent=2)
    
    output_path = os.path.join(os.path.dirname(__file__), 'golden_lbo_data.json')
    with open(output_path, 'w') as f:
        f.write(output_data_json)
        
    print(f"Golden data saved to {output_path}")

if __name__ == "__main__":
    generate_golden_data()
