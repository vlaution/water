import sys
import os
import asyncio
import json

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.real_options_service import RealOptionsService
from backend.calculations.real_options_models import RealOptionsRequest

async def test_real_options():
    print("Initializing RealOptionsService...")
    service = RealOptionsService()
    
    # Test Case 1: Standard Call Option (Expansion)
    # S=100, K=100, T=1, r=5%, sigma=20%
    # Expected Call Value ~ 10.45
    print("\n--- Test Case 1: Standard Call Option (Expansion) ---")
    req1 = RealOptionsRequest(
        option_type="expansion",
        asset_value=100,
        strike_price=100,
        time_to_expiration=1,
        risk_free_rate=0.05,
        volatility=0.20
    )
    res1 = await service.calculate_option_value(req1)
    print(f"Option Value: {res1.option_value:.2f} (Expected ~10.45)")
    print(f"Delta: {res1.greeks.delta:.2f}")
    print(f"Insight: {res1.strategic_insight}")
    
    # Test Case 2: High Volatility (Patent)
    # S=50, K=60, T=2, r=5%, sigma=50%
    # OTM but high vol should give value
    print("\n--- Test Case 2: High Volatility (Patent) ---")
    req2 = RealOptionsRequest(
        option_type="patent",
        asset_value=50,
        strike_price=60,
        time_to_expiration=2,
        risk_free_rate=0.05,
        volatility=0.50
    )
    res2 = await service.calculate_option_value(req2)
    print(f"Option Value: {res2.option_value:.2f}")
    print(f"Vega: {res2.greeks.vega:.2f}")
    print(f"Insight: {res2.strategic_insight}")

    # Test Case 3: Input Derivation (Missing r and sigma)
    print("\n--- Test Case 3: Input Derivation ---")
    req3 = RealOptionsRequest(
        option_type="expansion",
        asset_value=100,
        strike_price=100,
        time_to_expiration=1,
        sector="technology"
        # r and sigma missing
    )
    res3 = await service.calculate_option_value(req3)
    print(f"Derived Risk-Free Rate: {res3.inputs_used['risk_free_rate']:.4f}")
    print(f"Derived Volatility: {res3.inputs_used['volatility']:.2f}")
    print(f"Option Value: {res3.option_value:.2f}")

if __name__ == "__main__":
    asyncio.run(test_real_options())
