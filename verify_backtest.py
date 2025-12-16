import requests
import json

url = "http://127.0.0.1:8000/api/analytics/backtest"
payload = {
    "sector": "Technology",
    "years": 5
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Accuracy Score: {data.get('accuracy_score')}")
        print(f"Transactions Analyzed: {data.get('transactions_analyzed')}")
        if data.get('details'):
            print(f"First Deal Used Multiple: {data['details'][0].get('used_multiple')}")
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
