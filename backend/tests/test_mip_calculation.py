import pytest
from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator
from backend.calculations.models import (
    LBOInput, LBOFinancing, DebtTranche, MIPConfig, MIPTrancheInput, 
    LBOAssumptions, ProjectionAssumptions
)

@pytest.fixture
def base_lbo_input():
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

def test_legacy_mip_pool(base_lbo_input):
    # Setup Legacy Pool
    base_lbo_input.mip_assumptions = MIPConfig(
        option_pool_percent=0.10,
        tranches=[]
    )
    
    # Run
    _, _, results = EnhancedLBOCalculator.calculate(base_lbo_input)
    
    exit_equity = results["exit_equity"]
    mip_value = results["mip_value"]
    
    # Expect 10% of Exit Equity
    assert mip_value == pytest.approx(exit_equity * 0.10, 0.01)
    assert results["profit"] == pytest.approx(exit_equity - results["entry_equity"] - mip_value, 0.01)

def test_time_vesting_partial(base_lbo_input):
    # Setup Time Vesting Tranche
    # 4 Year Vesting, 5 Year Holding -> Should be 100% vested
    # Let's make holding period 2 years to test partial
    base_lbo_input.holding_period = 2
    
    tranche = MIPTrancheInput(
        name="Time Options",
        allocation_percent=0.05,
        vesting_type="time",
        vesting_period_years=4.0,
        cliff_years=1.0
    )
    base_lbo_input.mip_assumptions = MIPConfig(tranches=[tranche])
    
    _, _, results = EnhancedLBOCalculator.calculate(base_lbo_input)
    
    exit_equity = results["exit_equity"]
    mip_value = results["mip_value"]
    
    # Expected: 2/4 = 50% vested. 
    # Value = Exit Equity * 5% * 50%
    expected_value = exit_equity * 0.05 * 0.50
    
    assert mip_value == pytest.approx(expected_value, 0.01)
    assert results["mip_tranches"][0]["vested_percent"] == 50.0

def test_performance_vesting_fail(base_lbo_input):
    # Setup Performance Tranche with high MOIC target
    tranche = MIPTrancheInput(
        name="Perf Options",
        allocation_percent=0.05,
        vesting_type="performance",
        performance_target_moic=10.0 # Unlikely to hit with flat growth
    )
    base_lbo_input.mip_assumptions = MIPConfig(tranches=[tranche])
    
    _, _, results = EnhancedLBOCalculator.calculate(base_lbo_input)
    
    assert results["mip_value"] == 0.0
    assert results["mip_tranches"][0]["vested_percent"] == 0.0

def test_performance_vesting_success(base_lbo_input):
    # Setup Performance Tranche with low MOIC target
    tranche = MIPTrancheInput(
        name="Perf Options",
        allocation_percent=0.05,
        vesting_type="performance",
        performance_target_moic=1.0 # Should hit
    )
    base_lbo_input.mip_assumptions = MIPConfig(tranches=[tranche])
    
    _, _, results = EnhancedLBOCalculator.calculate(base_lbo_input)
    
    exit_equity = results["exit_equity"]
    expected_value = exit_equity * 0.05 * 1.0
    
    assert results["mip_value"] == pytest.approx(expected_value, 0.01)
    assert results["mip_tranches"][0]["vested_percent"] == 100.0
