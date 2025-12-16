import sys
import os

# Add project root to path
# __file__ = backend/tests/manual_test_market_data.py
# dirname = backend/tests
# dirname = backend
# dirname = water (root)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.financial_data.market_data_service import market_data_service

def test_market_data():
    print("Testing Market Data Service...")
    
    # 1. Test Rates
    print("\n--- Interest Rates ---")
    rates = market_data_service.fetch_interest_rates()
    for k, v in rates.items():
        print(f"{k}: {v:.2%}")
        
    # 2. Test Leverage Multiples
    print("\n--- Leverage Multiples ---")
    sectors = ["Technology", "Healthcare", "Unknown"]
    for sector in sectors:
        mults = market_data_service.fetch_leverage_multiples(sector)
        print(f"Sector: {sector} -> {mults}")
        
    # 3. Test Exit Multiples
    print("\n--- Exit Multiples ---")
    for sector in sectors:
        mults = market_data_service.fetch_exit_multiples(sector)
        print(f"Sector: {sector} -> {mults}")
        
if __name__ == "__main__":
    test_market_data()
