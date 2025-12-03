import requests
import json

# Test Precedent Transactions calculation
url = "http://localhost:8000/calculate"

data = {
    "company_name": "Precedent Transactions Test",
    "currency": "USD",
    "precedent_transactions_input": {
        "transactions": [
            {
                "target_name": "Company A",
                "acquirer_name": "Buyer 1",
                "announcement_date": "2023-01-15",
                "deal_value": 500,  # $500M
                "revenue": 200,  # $200M
                "ebitda": 50  # $50M
            },
            {
                "target_name": "Company B",
                "acquirer_name": "Buyer 2",
                "announcement_date": "2023-03-20",
                "deal_value": 800,  # $800M
                "revenue": 300,  # $300M
                "ebitda": 80  # $80M
            },
            {
                "target_name": "Company C",
                "acquirer_name": "Buyer 3",
                "announcement_date": "2023-06-10",
                "deal_value": 600,  # $600M
                "revenue": 250,  # $250M
                "ebitda": 60  # $60M
            }
        ],
        "target_revenue": 220,  # Target company: $220M revenue
        "target_ebitda": 55,  # Target company: $55M EBITDA
        "use_median": True
    }
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\nPrecedent Transactions Calculation Successful!")
        print(f"\nEnterprise Value: ${result['enterprise_value']:,.2f}")
        print(f"Equity Value: ${result['equity_value']:,.2f}")
        print(f"\nMethods Used:")
        for method, details in result['methods'].items():
            print(f"  - {method}: ${details['value']:,.2f} (weight: {details['weight']*100}%)")
        print(f"\nRun ID: {result.get('run_id', 'N/A')}")
        
        # Calculate what the multiples should be
        print("\n--- Transaction Multiples ---")
        for txn in data['precedent_transactions_input']['transactions']:
            ev_rev = txn['deal_value'] / txn['revenue']
            ev_ebitda = txn['deal_value'] / txn['ebitda']
            print(f"{txn['target_name']}: EV/Rev={ev_rev:.2f}x, EV/EBITDA={ev_ebitda:.2f}x")
    else:
        print(f"\nError: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"\nException: {e}")
