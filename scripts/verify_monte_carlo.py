import sys
import os
import asyncio
import json
import numpy as np

# Add project root to path
sys.path.append(os.getcwd())

from backend.calculations.monte_carlo_models import MonteCarloRequest, SimulationVariable, DistributionType
from backend.services.monte_carlo_service import MonteCarloService

def test_monte_carlo_simulation():
    print("--- Testing Monte Carlo Simulation ---")
    
    # 1. Define Request
    # Base Case: Revenue 100, Growth 5%, Margin 20%, WACC 10%
    # Expected EV approx: 
    # Y1: 105 * 0.2 * 0.8 * 0.75 / 1.1 = 11.45
    # ... Simplified check:
    # If we simulate Growth with Mean 5% and StdDev 0%, we should get exactly the base case.
    
    req = MonteCarloRequest(
        base_enterprise_value=0, # Not used in calculation, just for ref
        base_revenue=1000000,
        base_ebitda=200000,
        iterations=1000,
        variables=[
            SimulationVariable(
                name="revenue_growth",
                distribution=DistributionType.NORMAL,
                params={"mean": 0.05, "std_dev": 0.01} # Small variation
            ),
            SimulationVariable(
                name="ebitda_margin",
                distribution=DistributionType.NORMAL,
                params={"mean": 0.20, "std_dev": 0.0} # Fixed
            ),
            SimulationVariable(
                name="wacc",
                distribution=DistributionType.NORMAL,
                params={"mean": 0.10, "std_dev": 0.0} # Fixed
            )
        ]
    )
    
    # 2. Run Simulation
    service = MonteCarloService()
    result = service.run_simulation(req)
    
    # 3. Verify Results
    print(f"Iterations Run: {result.iterations_run}")
    print(f"Mean EV: ${result.statistics.mean:,.2f}")
    print(f"Std Dev: ${result.statistics.std_dev:,.2f}")
    print(f"Min: ${result.statistics.min:,.2f}")
    print(f"Max: ${result.statistics.max:,.2f}")
    
    # Check consistency
    # With 5% growth, 20% margin, 10% WACC, 2.5% terminal growth
    # EV should be roughly around ~1.5M - 2M range for 1M revenue
    
    if result.statistics.mean > 1000000 and result.statistics.mean < 3000000:
        print("[PASS] Mean EV is within reasonable range.")
    else:
        print(f"[FAIL] Mean EV {result.statistics.mean} seems off.")
        
    if result.statistics.std_dev > 0:
        print("[PASS] Standard Deviation is positive (variation occurred).")
    else:
        print("[FAIL] Standard Deviation is 0.")
        
    if len(result.histogram) > 0:
        print("[PASS] Histogram data generated.")
    else:
        print("[FAIL] Histogram missing.")

if __name__ == "__main__":
    test_monte_carlo_simulation()
