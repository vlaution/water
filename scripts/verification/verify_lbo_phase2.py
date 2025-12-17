import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.calculations.models import *
from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator

def create_base_case():
    return LBOInput(
        solve_for="entry_price",
        entry_revenue=100,
        entry_ebitda=20,
        entry_ev_ebitda_multiple=10.0,
        financing=LBOFinancing(
             tranches=[
                 DebtTranche(name="Senior Debt", leverage_multiple=4.0, interest_rate=0.06, maturity=5)
             ],
             equity_contribution_percent=0.4
        ),
        assumptions=LBOAssumptions(
            hurdle_rate=0.08,
            carry_percent=0.20
        ),
        revenue_growth_rate=0.05,
        ebitda_margin=0.25,
        capex_percentage=0.03,
        nwc_percentage=0.05,
        tax_rate=0.25,
        holding_period=5,
        exit_ev_ebitda_multiple=10.0,
        refinancing_config=RefinancingConfig(enabled=False, refinance_year=3),
        tax_assumptions=TaxConfig(step_up_percent=0.0)
    )

def test_optimal_refinancing():
    print("\n--- Testing Optimal Refinancing ---")
    lbo = create_base_case()
    lbo.solve_for = LBOSolverMode.OPTIMAL_REFINANCING
    print(f"DEBUG: lbo.solve_for = {lbo.solve_for} (Type: {type(lbo.solve_for)})")
    print(f"DEBUG: Enum Value = {LBOSolverMode.OPTIMAL_REFINANCING}")
    
    # Config: High growth, expensive initial debt (8%), cheap refi debt (4%)
    # This should make refinancing attractive
    lbo.financing.tranches[0].interest_rate = 0.09 
    lbo.refinancing_config = RefinancingConfig(
        enabled=True,
        refinance_year=3, # Default, but solver should find best
        new_interest_rate=0.04,
        refinance_amount_pct=1.0,
        penalty_fee_percent=0.0
    )
    
    # Run solver
    val, details = EnhancedLBOCalculator.calculate(lbo)
    irr = details['returns_analysis']['irr']
    print(f"Optimal Result: IRR={round(irr*100, 2)}%")
    print(f"Note: {details.get('optimization_note', 'No details')}")
    
    # Manual check: Run year 1 vs year 3
    lbo.solve_for = "entry_price" # Reset to single run mode (effectively)
    
    lbo.refinancing_config.refinance_year = 1
    irr1, _, _ = EnhancedLBOCalculator._run_waterfall(lbo, 10.0)
    print(f"Manual Year 1 IRR: {round(irr1*100, 2)}%")
    
    lbo.refinancing_config.refinance_year = 3
    irr3, _, _ = EnhancedLBOCalculator._run_waterfall(lbo, 10.0)
    print(f"Manual Year 3 IRR: {round(irr3*100, 2)}%")

def test_waterfall():
    print("\n--- Testing Multi-tier Waterfall ---")
    lbo = create_base_case()
    # Force high returns to trigger carry
    # Entry 10x, Exit 15x
    lbo.entry_ev_ebitda_multiple = 8.0
    lbo.exit_ev_ebitda_multiple = 15.0
    lbo.assumptions.carry_percent = 0.20
    
    val, details = EnhancedLBOCalculator.calculate(lbo)
    
    ret = details["returns_analysis"]
    print(f"Entry Equity: {ret['entry_equity']}")
    print(f"Exit Equity: {ret['exit_equity']}")
    print(f"Profit: {ret['profit']}")
    print(f"GP Carry: {ret['gp_carry']}")
    print(f"LP Profit: {ret['lp_profit']}")
    
    # Verification Calc
    # Pref = Equity * ((1.08)^5 - 1)
    equity = ret['entry_equity']
    pref = equity * ((1.08)**5 - 1)
    
    # Catchup = Pref * (0.2 / 0.8) = Pref / 4
    catchup = pref * 0.25
    
    print(f"Calculated Pref Limit: {round(pref, 2)}")
    print(f"Calculated Catchup Limit: {round(catchup, 2)}")
    
    # If profit huge, GP should get Catchup + 20% of remainder
    # Here GP Carry should be roughly Catchup + 0.2 * (Profit - Pref - Catchup)
    # Actually Catchup accounts for the 20% of the Pref portion too strictly speaking in "Full Catchup"
    # Logic in code: GP gets Catchup until GP/(GP+LP) = 20%.
    # If Catchup = Pref / 4, then GP = Pref/4, LP = Pref. Total = 1.25 Pref. GP% = (0.25/1.25) = 20%. Correct.
    
    # Check if GP Carry >= Catchup (since high return)
    if ret['gp_carry'] > catchup:
        print("✅ Correct: GP Carry includes full catchup + carry")
    else:
        print("⚠️ Warning: Profit might not be high enough for full catchup")

def test_step_up():
    print("\n--- Testing Asset Step-Up ---")
    lbo = create_base_case()
    lbo.tax_assumptions = TaxConfig(step_up_percent=0.0) # Base case
    
    _, det_base = EnhancedLBOCalculator.calculate(lbo)
    fcf_base = det_base['schedule'][0]['fcf_debt']
    
    # Step up 50% of value
    lbo.tax_assumptions.step_up_percent = 0.50
    _, det_step = EnhancedLBOCalculator.calculate(lbo)
    fcf_step = det_step['schedule'][0]['fcf_debt']
    
    print(f"FCF Year 1 (No Step-up): {fcf_base}")
    print(f"FCF Year 1 (50% Step-up): {fcf_step}")
    
    if fcf_step > fcf_base:
        print(f"✅ Correct: Step-up increased FCF by {round(fcf_step - fcf_base, 2)} (Tax Shield)")
    else:
        print("❌ Error: Step-up did not increase FCF")

if __name__ == "__main__":
    try:
        test_optimal_refinancing()
        test_waterfall()
        test_step_up()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
