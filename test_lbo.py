import requests
import json

# Test LBO calculation
url = "http://localhost:8000/calculate"

data = {
    "company_name": "LBO Test Company",
    "currency": "USD",
    "lbo_input": {
        "entry_revenue": 200,  # $200M revenue
        "entry_ebitda": 50,  # $50M EBITDA (25% margin)
        "entry_ev_ebitda_multiple": 10.0,  # 10x entry multiple
        "debt_percentage": 0.60,  # 60% debt financing
        "debt_interest_rate": 0.06,  # 6% interest
        "revenue_growth_rate": 0.05,  # 5% annual growth
        "ebitda_margin": 0.25,  # 25% EBITDA margin
        "capex_percentage": 0.03,  # 3% CapEx
        "nwc_percentage": 0.05,  # 5% NWC
        "holding_period": 5,  # 5 year hold
        "exit_ev_ebitda_multiple": 10.0,  # 10x exit multiple
        "target_irr": 0.20  # 20% target IRR
    }
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\nLBO Calculation Successful!")
        print(f"\nEnterprise Value: ${result['enterprise_value']:,.2f}")
        print(f"Equity Value: ${result['equity_value']:,.2f}")
        print(f"\nMethods Used:")
        for method, details in result['methods'].items():
            print(f"  - {method}: ${details['value']:,.2f} (weight: {details['weight']*100}%)")
        print(f"\nRun ID: {result.get('run_id', 'N/A')}")
        
        # Calculate expected values
        print("\n--- LBO Metrics ---")
        entry_ev = data['lbo_input']['entry_ebitda'] * data['lbo_input']['entry_ev_ebitda_multiple']
        debt = entry_ev * data['lbo_input']['debt_percentage']
        equity = entry_ev * (1 - data['lbo_input']['debt_percentage'])
        print(f"Entry EV: ${entry_ev}M")
        print(f"Debt: ${debt}M ({data['lbo_input']['debt_percentage']*100}%)")
        print(f"Equity Investment: ${equity}M ({(1-data['lbo_input']['debt_percentage'])*100}%)")
    else:
        print(f"\nError: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"\nException: {e}")
