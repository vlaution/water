import sys
import os
import asyncio
import json

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.auditing_service import AuditingService
from backend.calculations.models import ValuationInput, DCFInput, ProjectionAssumptions, HistoricalFinancials

def create_test_input(terminal_growth, discount_rate, revenue_growth):
    return ValuationInput(
        company_name="Test Corp",
        currency="USD",
        dcf_input=DCFInput(
            historical=HistoricalFinancials(
                years=[2020, 2021, 2022],
                revenue=[100, 110, 120],
                ebitda=[20, 22, 25],
                ebit=[15, 17, 20],
                net_income=[10, 12, 15],
                capex=[5, 5, 6],
                nwc=[2, 2, 3]
            ),
            projections=ProjectionAssumptions(
                revenue_growth_start=revenue_growth,
                revenue_growth_end=0.03,
                ebitda_margin_start=0.20,
                ebitda_margin_end=0.22,
                tax_rate=0.25,
                discount_rate=discount_rate,
                terminal_growth_rate=terminal_growth,
                terminal_exit_multiple=12.0,
                depreciation_rate=0.03,
                working_capital={"dso": 45, "dio": 60, "dpo": 30}
            ),
            shares_outstanding=1000000,
            net_debt=5000000
        )
    )

async def test_auditing():
    print("Initializing AuditingService...")
    service = AuditingService()
    
    # Test Case 1: High Growth (Should Fail)
    print("\n--- Test Case 1: High Terminal Growth (12%) ---")
    input1 = create_test_input(terminal_growth=0.12, discount_rate=0.10, revenue_growth=0.05)
    issues1 = await service.audit_valuation_input(input1)
    for issue in issues1:
        print(f"[{issue.severity.upper()}] {issue.message}")
        
    # Test Case 2: Low WACC (Should Warn - assuming industry wacc is higher)
    # Note: WACC check requires industry data. Since we don't have a real ticker/provider here, 
    # the service might skip it or fail if not mocked.
    # Let's see what happens. Ideally we should mock WaccCalculatorService.
    print("\n--- Test Case 2: Low WACC (2%) ---")
    input2 = create_test_input(terminal_growth=0.02, discount_rate=0.02, revenue_growth=0.05)
    issues2 = await service.audit_valuation_input(input2)
    for issue in issues2:
        print(f"[{issue.severity.upper()}] {issue.message}")

    # Test Case 3: High Revenue Growth (Should Warn)
    print("\n--- Test Case 3: High Revenue Growth (60%) ---")
    input3 = create_test_input(terminal_growth=0.02, discount_rate=0.10, revenue_growth=0.60)
    issues3 = await service.audit_valuation_input(input3)
    for issue in issues3:
        print(f"[{issue.severity.upper()}] {issue.message}")

if __name__ == "__main__":
    asyncio.run(test_auditing())
