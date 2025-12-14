from backend.services.valuation.formulas.vc_method import VCMethodCalculator
from backend.calculations.models import VCMethodInput, ReturnType

def test_vc_method():
    # Test Case 1: Multiple Method
    input_multiple = VCMethodInput(
        investment_amount=2000000,
        target_return_type=ReturnType.MULTIPLE,
        target_return=10.0,
        exit_year=5,
        exit_metric="revenue",
        projected_exit_metric=20000000,
        exit_multiple=5.0,
        current_shares=1000000
    )
    
    result_multiple = VCMethodCalculator.calculate(input_multiple)
    
    print("--- Test Case 1: Multiple Method ---")
    print(f"Exit Value: {result_multiple.exit_value:,.2f}") # Should be 100M (20M * 5)
    print(f"Post-Money: {result_multiple.post_money_valuation:,.2f}") # Should be 10M (100M / 10)
    print(f"Pre-Money: {result_multiple.pre_money_valuation:,.2f}") # Should be 8M (10M - 2M)
    print(f"Ownership Required: {result_multiple.ownership_required:.2%}") # Should be 20% (2M / 10M)
    print(f"New Shares: {result_multiple.new_shares_issued:,.2f}") # Should be 250,000 (1M * (0.2 / 0.8))
    
    # Test Case 2: IRR Method
    input_irr = VCMethodInput(
        investment_amount=2000000,
        target_return_type=ReturnType.IRR,
        target_return=0.40, # 40% IRR
        exit_year=5,
        exit_metric="revenue",
        projected_exit_metric=20000000,
        exit_multiple=5.0,
        current_shares=1000000
    )
    
    result_irr = VCMethodCalculator.calculate(input_irr)
    
    print("\n--- Test Case 2: IRR Method ---")
    print(f"Exit Value: {result_irr.exit_value:,.2f}") # 100M
    # Post-Money = 100M / (1.4^5) = 100M / 5.378 = ~18.59M
    print(f"Post-Money: {result_irr.post_money_valuation:,.2f}") 
    print(f"Pre-Money: {result_irr.pre_money_valuation:,.2f}")
    print(f"Ownership Required: {result_irr.ownership_required:.2%}")

    # Test Case 3: Audit Check (High Dilution)
    input_dilutive = VCMethodInput(
        investment_amount=5000000, # High investment
        target_return_type=ReturnType.MULTIPLE,
        target_return=10.0,
        exit_year=5,
        exit_metric="revenue",
        projected_exit_metric=10000000, # Low exit
        exit_multiple=5.0,
        current_shares=1000000
    )
    
    result_dilutive = VCMethodCalculator.calculate(input_dilutive)
    print("\n--- Test Case 3: Dilution Warning ---")
    print(f"Ownership Required: {result_dilutive.ownership_required:.2%}")
    for issue in result_dilutive.audit_issues:
        print(f"Audit Issue: {issue.message}")

if __name__ == "__main__":
    test_vc_method()
