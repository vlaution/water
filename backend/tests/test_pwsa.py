import pytest
from unittest.mock import MagicMock
from backend.calculations.core import ValuationEngine
from backend.calculations.models import PWSARequest, ScenarioConfig, ValuationInput

def test_pwsa_calculation():
    engine = ValuationEngine()
    
    # Mock calculate method to return predictable values
    engine.calculate = MagicMock()
    
    def side_effect(input_data):
        # Return different values based on some property of input_data
        # We'll use company_name as a proxy for scenario value
        if input_data.company_name == "Scenario A":
            return {"enterprise_value": 100.0}
        elif input_data.company_name == "Scenario B":
            return {"enterprise_value": 200.0}
        elif input_data.company_name == "Scenario C":
            return {"enterprise_value": 300.0}
        return {"enterprise_value": 0.0}
        
    engine.calculate.side_effect = side_effect
    
    # Create request with 3 scenarios
    # Probabilities: 0.2, 0.3, 0.5 (Sum = 1.0)
    scenarios = [
        ScenarioConfig(
            name="Scenario A",
            probability=0.2,
            assumptions=ValuationInput(company_name="Scenario A")
        ),
        ScenarioConfig(
            name="Scenario B",
            probability=0.3,
            assumptions=ValuationInput(company_name="Scenario B")
        ),
        ScenarioConfig(
            name="Scenario C",
            probability=0.5,
            assumptions=ValuationInput(company_name="Scenario C")
        )
    ]
    
    request = PWSARequest(scenarios=scenarios)
    
    result = engine.calculate_pwsa(request)
    
    # Verify Weighted Value
    # 100*0.2 + 200*0.3 + 300*0.5 = 20 + 60 + 150 = 230
    assert abs(result.probability_weighted_value - 230.0) < 0.001
    
    # Verify Risk Metrics
    # Upside: 300
    assert result.risk_metrics.upside_potential == 300.0
    
    # VaR 95%
    # Sorted values: 100 (0.2), 200 (0.3), 300 (0.5)
    # Cum Prob: 0.2 (>= 0.05) -> 100
    assert result.risk_metrics.var_95 == 100.0
    
    # Std Dev
    # Mean = 230
    # Var = 0.2*(100-230)^2 + 0.3*(200-230)^2 + 0.5*(300-230)^2
    # Var = 0.2*16900 + 0.3*900 + 0.5*4900
    # Var = 3380 + 270 + 2450 = 6100
    # StdDev = sqrt(6100) = 78.102
    assert abs(result.risk_metrics.standard_deviation - 78.102) < 0.01

def test_pwsa_normalization():
    engine = ValuationEngine()
    engine.calculate = MagicMock(return_value={"enterprise_value": 100.0})
    
    # Probabilities: 50, 50 (Sum = 100) -> Should normalize to 0.5, 0.5
    scenarios = [
        ScenarioConfig(name="A", probability=50, assumptions=ValuationInput(company_name="A")),
        ScenarioConfig(name="B", probability=50, assumptions=ValuationInput(company_name="B"))
    ]
    
    request = PWSARequest(scenarios=scenarios)
    result = engine.calculate_pwsa(request)
    
    assert len(result.scenario_results) == 2
    assert abs(result.scenario_results[0].probability - 0.5) < 0.001
    assert abs(result.scenario_results[1].probability - 0.5) < 0.001

def test_pwsa_zero_probability():
    engine = ValuationEngine()
    
    scenarios = [
        ScenarioConfig(name="A", probability=0, assumptions=ValuationInput(company_name="A"))
    ]
    
    request = PWSARequest(scenarios=scenarios)
    
    with pytest.raises(ValueError, match="Total probability cannot be zero"):
        engine.calculate_pwsa(request)
