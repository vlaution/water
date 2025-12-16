import requests
import os
import json

BASE_URL = "http://localhost:8000"

def test_secrets():
    print("Testing Secrets API...")
    # 1. Set Secret
    resp = requests.post(f"{BASE_URL}/api/settings/secrets", json={
        "FRED_API_KEY": "test_fred_key",
        "ALPHA_VANTAGE_KEY": "test_alpha_key"
    })
    print(f"Set Secrets: {resp.status_code} - {resp.json()}")

    # 2. Get Status
    resp = requests.get(f"{BASE_URL}/api/settings/secrets")
    print(f"Get Secrets Status: {resp.status_code} - {resp.json()}")
    assert resp.json()["FRED_API_KEY"] == True

def test_historical_snapshot():
    print("\nTesting Historical Snapshot...")
    # 1. Trigger Snapshot
    try:
        resp = requests.post(f"{BASE_URL}/api/market-data/historical/snapshot")
        print(f"Trigger Snapshot: {resp.status_code}")
        if resp.status_code == 200:
            print(resp.json())
        else:
            print(resp.text)
    except Exception as e:
        print(f"Snapshot failed (maybe invalid key or network): {e}")

    # 2. Get History
    resp = requests.get(f"{BASE_URL}/api/market-data/historical/?days=7")
    print(f"Get History: {resp.status_code}")
    data = resp.json()
    print(f"Found {len(data)} snapshots")
    if len(data) > 0:
        print("Sample:", data[0])

if __name__ == "__main__":
    test_secrets()
    test_historical_snapshot()
