from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator
from backend.calculations.models import (
    LBOInput, LBOFinancing, DebtTranche, MIPConfig, MIPTrancheInput, 
    LBOAssumptions, ProjectionAssumptions
)
import math

def approx(a, b, tol=0.01):
    return abs(a - b) < tol

def get_base_lbo_input():
    return LBOInput(
        entry_revenue=100,
        entry_ebitda=20,
        entry_ev_ebitda_multiple=10.0,
        financing=LBOFinancing(
            tranches=[
                DebtTranche(name="Senior", leverage_multiple=4.0, interest_rate=0.05)
            ]
        ),
        assumptions=LBOAssumptions(transaction_fees_percent=0.0),
        holding_period=5,
        exit_ev_ebitda_multiple=10.0,
        revenue_growth_rate=0.0, # Flat for simplicity
        ebitda_margin=0.20
    )

def test_legacy_mip_pool():
    print("Running test_legacy_mip_pool...")
    lbo_input = get_base_lbo_input()
    lbo_input.mip_assumptions = MIPConfig(
        option_pool_percent=0.10,
        tranches=[]
    )
    
    _, results = EnhancedLBOCalculator.calculate(lbo_input)
    
    exit_equity = results["returns_analysis"]["exit_equity"]
    mip_value = results["returns_analysis"]["mip_value"]
    
    expected = exit_equity * 0.10
    print(f"  Exit Equity: {exit_equity}, MIP: {mip_value}, Expected: {expected}")
    
    if approx(mip_value, expected):
        print("  PASS")
    else:
        print("  FAIL")

def test_time_vesting_partial():
    print("Running test_time_vesting_partial...")
    lbo_input = get_base_lbo_input()
    lbo_input.holding_period = 2
    
    tranche = MIPTrancheInput(
        name="Time Options",
        allocation_percent=0.05,
        vesting_type="time",
        vesting_period_years=4.0,
        cliff_years=1.0
    )
    lbo_input.mip_assumptions = MIPConfig(tranches=[tranche])
    
    _, results = EnhancedLBOCalculator.calculate(lbo_input)
    
    exit_equity = results["returns_analysis"]["exit_equity"]
    mip_value = results["returns_analysis"]["mip_value"]
    vested_percent = results["returns_analysis"]["mip_tranches"][0]["vested_percent"]
    
    expected_value = exit_equity * 0.05 * 0.50
    
    print(f"  Exit Equity: {exit_equity}, MIP: {mip_value}, Expected: {expected_value}")
    print(f"  Vested %: {vested_percent}, Expected: 50.0")
    
    if approx(mip_value, expected_value) and approx(vested_percent, 50.0):
        print("  PASS")
    else:
        print("  FAIL")

def test_performance_vesting_success():
    print("Running test_performance_vesting_success...")
    lbo_input = get_base_lbo_input()
    
    tranche = MIPTrancheInput(
        name="Perf Options",
        allocation_percent=0.05,
        vesting_type="performance",
        performance_target_moic=1.0 # Should hit
    )
    lbo_input.mip_assumptions = MIPConfig(tranches=[tranche])
    
    _, results = EnhancedLBOCalculator.calculate(lbo_input)
    
    exit_equity = results["returns_analysis"]["exit_equity"]
    mip_value = results["returns_analysis"]["mip_value"]
    expected_value = exit_equity * 0.05 * 1.0
    
    print(f"  Exit Equity: {exit_equity}, MIP: {mip_value}, Expected: {expected_value}")
    
    if approx(mip_value, expected_value) and results["returns_analysis"]["mip_tranches"][0]["vested_percent"] == 100.0:
        print("  PASS")
    else:
        print("  FAIL")

if __name__ == "__main__":
    test_legacy_mip_pool()
    test_time_vesting_partial()
    test_performance_vesting_success()
