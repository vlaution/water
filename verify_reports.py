import requests
import sys

BASE_URL = "http://localhost:8000"

def test_report_generation():
    # 1. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/demo-login")
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Need a valuation ID. 
    # Attempt to fetch history, otherwise we might need to assume or create one.
    # Let's try to list valuations if there's an endpoint, or just use a dummy one to test 404/500 vs 422.
    # Actually, the demo user might not have history.
    # Let's try to hit the endpoint with a fake ID. expecting 404 (handled) vs 500 (crash).
    
    print("Testing Report Generation (Expect 404 for fake ID)...")
    payload = {
        "valuation_id": "fake-123",
        "company_name": "Test Co",
        "sections": ["Executive Summary"],
        "format": "pdf",
        "branding": True
    }
    
    resp = requests.post(f"{BASE_URL}/api/reports/generate", json=payload, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text[:100]}")
    
    if resp.status_code == 404:
        print("Success: Endpoint reachable (returned 404 for missing valuation).")
    elif resp.status_code == 200:
        print("Success: Report generated!")
    else:
        print("Failed: Unexpected status code.")

if __name__ == "__main__":
    test_report_generation()
