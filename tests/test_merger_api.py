import requests
import json

url = "http://localhost:8000/api/merger/analyze"
payload = {
    "acquirer_data": {
        "ticker": "AAPL",
        "share_price": 150.0,
        "shares_outstanding": 1000,
        "eps": 5.0,
        "pe_ratio": 30.0,
        "tax_rate": 0.21,
        "excess_cash": 5000
    },
    "target_data": {
        "ticker": "TGT",
        "net_income": 200,
        "shares_outstanding": 100,
        "current_share_price": 40.0,
        "pre_tax_synergies": 50,
        "transaction_fees": 20
    },
    "deal_structure": {
        "offer_price": 50.0,
        "percent_cash": 0.5,
        "percent_stock": 0.5,
        "percent_debt": 0.0,
        "interest_rate_on_debt": 0.06,
        "interest_rate_on_cash": 0.02
    }
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
