import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_demo_login():
    print("\n--- Testing Demo Login ---")
    try:
        url = f"{BASE_URL}/auth/demo-login"
        print(f"POST {url}")
        resp = requests.post(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Login Successful")
            print(f"User: {data['user']}")
            assert data['user']['is_demo'] == True
            return data
        else:
            print(f"Failed: {resp.text}")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_secrets_update(token):
    print("\n--- Testing Secrets Update ---")
    try:
        url = f"{BASE_URL}/api/settings/secrets"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "ALPHA_VANTAGE_KEY": "demo_test_key_123"
        }
        print(f"POST {url} with payload {payload}")
        resp = requests.post(url, headers=headers, json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        assert resp.status_code == 200
        
        # Verify status
        status_url = f"{BASE_URL}/api/settings/secrets"
        status_resp = requests.get(status_url, headers=headers)
        status_data = status_resp.json()
        print(f"Status Data: {status_data}")
        assert status_data["ALPHA_VANTAGE_KEY"] == True
        
    except Exception as e:
         print(f"Error: {e}")

if __name__ == "__main__":
    data = test_demo_login()
    if data:
        # We can try to update secrets even for demo user (though logic sets is_demo=False if we do)
        token = data['access_token']
        test_secrets_update(token)
