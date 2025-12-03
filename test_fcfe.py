import requests
import json

# Test FCFE calculation
url = "http://localhost:8000/calculate"

data = {
    "company_name": "FCFE Test Company",
    "currency": "USD",
    "dcfe_input": {
        "historical": {
            "years": [2020, 2021, 2022],
            "revenue": [100, 110, 120],
            "ebitda": [20, 22, 25],
            "ebit": [15, 17, 20],
            "net_income": [10, 12, 15],
            "capex": [5, 5, 6],
            "nwc": [2, 2, 3]
        },
        "projections": {
            "revenue_growth_start": 0.05,
            "revenue_growth_end": 0.03,
            "ebitda_margin_start": 0.20,
            "ebitda_margin_end": 0.22,
            "tax_rate": 0.25,
            "discount_rate": 0.10,
            "terminal_growth_rate": 0.025
        },
        "debt_schedule": [
            {"beginning_debt": 50, "new_borrowing": 10, "debt_repayment": 5, "interest_rate": 0.05},
            {"beginning_debt": 55, "new_borrowing": 5, "debt_repayment": 5, "interest_rate": 0.05},
            {"beginning_debt": 55, "new_borrowing": 0, "debt_repayment": 10, "interest_rate": 0.05},
            {"beginning_debt": 45, "new_borrowing": 0, "debt_repayment": 10, "interest_rate": 0.05},
            {"beginning_debt": 35, "new_borrowing": 0, "debt_repayment": 10, "interest_rate": 0.05}
        ],
        "cost_of_equity": 0.12,
        "terminal_growth_rate": 0.025,
        "shares_outstanding": 1000000
    }
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\nFCFE Calculation Successful!")
        print(f"\nEnterprise Value: ${result['enterprise_value']:,.2f}")
        print(f"Equity Value: ${result['equity_value']:,.2f}")
        print(f"\nMethods Used:")
        for method, details in result['methods'].items():
            print(f"  - {method}: ${details['value']:,.2f} (weight: {details['weight']*100}%)")
        print(f"\nRun ID: {result.get('run_id', 'N/A')}")
    else:
        print(f"\nError: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"\nException: {e}")
