import requests
import json

# Test Phase 7 Features
url = "http://localhost:8000/calculate"

data = {
    "company_name": "Phase 7 Test Corp",
    "currency": "USD",
    "dcf_input": {
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
            "terminal_growth_rate": 0.02,
            "terminal_exit_multiple": 12.0,  # Test Exit Multiple
            "depreciation_rate": 0.04,  # Test Depreciation
            "working_capital": {  # Test Detailed WC
                "dso": 45,
                "dio": 60,
                "dpo": 30
            }
        },
        "shares_outstanding": 1000000,
        "net_debt": 50
    },
    "anav_input": {  # Test ANAV
        "assets": {"Cash": 10, "Inventory": 20, "PP&E": 100},
        "liabilities": {"Debt": 50, "Payables": 10},
        "adjustments": {"PP&E": 20, "Inventory": -5}  # +20 to PP&E, -5 to Inventory
    },
    "scenarios": [  # Test Scenarios
        {
            "scenario_name": "Bull Case",
            "projections": {
                "revenue_growth_start": 0.10,
                "revenue_growth_end": 0.05,
                "ebitda_margin_start": 0.25,
                "ebitda_margin_end": 0.28,
                "tax_rate": 0.25,
                "discount_rate": 0.10,
                "terminal_growth_rate": 0.03,
                "depreciation_rate": 0.04
            }
        }
    ],
    "sensitivity_analysis": {  # Test Sensitivity
        "variable_1": "discount_rate",
        "range_1": [0.08, 0.10, 0.12],
        "variable_2": "terminal_growth_rate",
        "range_2": [0.01, 0.02, 0.03]
    }
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Phase 7 Calculation Successful!")
        print(f"\nEnterprise Value: ${result['enterprise_value']:,.2f}")
        print(f"Equity Value: ${result['equity_value']:,.2f}")
        
        print(f"\nMethods Used:")
        for method, details in result['methods'].items():
            print(f"  - {method}: ${details['value']:,.2f} (weight: {details['weight']*100}%)")
            
        print(f"\nWarnings: {result.get('warnings', [])}")
        
        print(f"\nScenarios:")
        for scenario in result.get('scenarios', []):
            print(f"  - {scenario['name']}: EV ${scenario['enterprise_value']:,.2f}")
            
        print(f"\nSensitivity Matrix:")
        sens = result.get('sensitivity', {})
        if sens:
            print(f"  X: {sens['x_axis']['name']} {sens['x_axis']['values']}")
            print(f"  Y: {sens['y_axis']['name']} {sens['y_axis']['values']}")
            print(f"  Matrix Size: {len(sens['matrix'])}x{len(sens['matrix'][0])}")
            
        print(f"\nDetailed Projections (First 3 years):")
        details = result.get('dcf_details', {})
        if details:
            print(f"  Revenue: {[round(x, 1) for x in details.get('revenue', [])[:3]]}")
            print(f"  EBITDA:  {[round(x, 1) for x in details.get('ebitda', [])[:3]]}")
            print(f"  FCFF:    {[round(x, 1) for x in details.get('fcff', [])[:3]]}")

    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"\n❌ Exception: {e}")
