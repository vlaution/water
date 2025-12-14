import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.valuation.formulas.gpc import GPCCalculator
from backend.calculations.models import GPCInput

def verify_gpc_logic():
    print("--- Testing GPC Logic ---")
    
    # Base metrics
    metrics = {"LTM Revenue": 100.0, "LTM EBITDA": 20.0}
    
    # Case 1: No multiples provided (Should use defaults or find peers)
    # Since we don't mock peers here, it might fallback to defaults [2.0, 10.0]
    # Revenue Val = 100 * 2.0 = 200
    # EBITDA Val = 20 * 10.0 = 200
    # Avg = 200M
    input_1 = GPCInput(
        target_ticker="TEST",
        peer_tickers=[],
        metrics=metrics,
        ev_revenue_multiple=None,
        ev_ebitda_multiple=None
    )
    val_1 = GPCCalculator.calculate(input_1)
    print(f"Valuation (Defaults): ${val_1:,.2f}")
    assert val_1 == 200_000_000.0, f"Expected 200M, got {val_1}"
    
    # Case 2: Explicit Multiples Provided
    # EV/Rev = 5.0 -> Val = 500
    # EV/EBITDA = 15.0 -> Val = 300
    # Avg = 400M
    input_2 = GPCInput(
        target_ticker="TEST",
        peer_tickers=[],
        metrics=metrics,
        ev_revenue_multiple=5.0,
        ev_ebitda_multiple=15.0
    )
    val_2 = GPCCalculator.calculate(input_2)
    print(f"Valuation (Explicit): ${val_2:,.2f}")
    assert val_2 == 400_000_000.0, f"Expected 400M, got {val_2}"
    
    print("✅ GPC Logic works: Explicit multiples override specific defaults/peers logic.")

if __name__ == "__main__":
    verify_gpc_logic()
