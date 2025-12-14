
import requests
import sys

BASE_URL = "http://localhost:8000"

def verify_csv_export():
    print("Verifying CSV Export...")
    
    # 0. Signup (if needed)
    signup_url = f"{BASE_URL}/auth/signup"
    signup_data = {"email": "portfolio_test@example.com", "password": "password123", "name": "Test User"}
    try:
        requests.post(signup_url, json=signup_data)
    except:
        pass

    # 1. Login to get token
    login_url = f"{BASE_URL}/auth/login"
    login_data = {"email": "portfolio_test@example.com", "password": "password123"}
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get a valuation run
        response = requests.get(f"{BASE_URL}/runs?limit=1", headers=headers)
        runs = response.json()
        if not runs:
            print("No runs found to export.")
            return
            
        run_id = runs[0]["id"]
        print(f"Using Run ID: {run_id}")
        
        # 3. Request CSV Export
        export_url = f"{BASE_URL}/api/excel/valuation/{run_id}/export?format=csv"
        print(f"Requesting: {export_url}")
        
        csv_resp = requests.get(export_url, headers=headers)
        
        if csv_resp.status_code != 200:
            print(f"FAILED: Status Code {csv_resp.status_code}")
            print(csv_resp.text)
            sys.exit(1)
            
        content = csv_resp.text
        print("Response Snippet:")
        print(content[:200])
        
        if "Section,Key,Value" in content or "Input," in content or "Output," in content:
            print("SUCCESS: Response looks like CSV.")
        else:
            print("FAILED: Response does not look like CSV.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_csv_export()
