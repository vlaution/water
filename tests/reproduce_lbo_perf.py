
import time
from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator
from backend.calculations.models import LBOInput, LBOFinancing, DebtTranche, LBOAssumptions, LBOSolverMode

def run_benchmark():
    # Setup Input
    tranche = DebtTranche(
        name="Senior Debt",
        interest_rate=0.08,
        amortization_rate=0.05,
        leverage_multiple=3.0,
        cash_interest=True
    )
    
    financing = LBOFinancing(
        tranches=[tranche]
    )
    
    lbo_input = LBOInput(
        solve_for=LBOSolverMode.ENTRY_PRICE,
        entry_revenue=100000000,
        entry_ebitda=20000000,
        financing=financing,
        assumptions=LBOAssumptions(),
        revenue_growth_rate=0.05,
        ebitda_margin=0.25,
        target_irr=0.20,
        exit_ev_ebitda_multiple=10.0
    )

    print("Starting Benchmark...")
    start_time = time.time()
    
    # Run Calculation
    # This involves the solver (20 loops) AND the sensitivity analysis (25 loops)
    # Total ~45 waterfall runs
    results = EnhancedLBOCalculator.calculate(lbo_input)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Total Duration: {duration:.4f} seconds")
    
    if "sensitivity_matrix" in results[2]:
        print("Sensitivity Analysis: Present")
    else:
        print("Sensitivity Analysis: MISSING")

if __name__ == "__main__":
    run_benchmark()
