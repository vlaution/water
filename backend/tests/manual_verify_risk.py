import requests
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

BASE_URL = "http://localhost:8000"

def get_auth_token():
    import uuid
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "testpassword123" # Stronger password just in case
    
    # 1. Try Signup
    signup_url = f"{BASE_URL}/auth/signup"
    signup_payload = {
        "email": email,
        "password": password,
        "full_name": "Test User"
    }
    try:
        requests.post(signup_url, json=signup_payload)
        # Ignore error if already exists
    except:
        pass

    # 2. Login
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(login_url, json=login_payload)
        response.raise_for_status()
        return response.json()["access_token"]

    except Exception as e:
        print(f"Login failed: {e}")
        return None

def ensure_test_user():
    # Quick hack to create user if not exists using direct DB access or just fail if 401
    # Since we can't easily import backend modules due to path issues without sys.path hacks,
    # we will rely on the user existing. If login fails, we print a helpful message.
    pass


def test_endpoint(name, url, token, method="GET", json_data=None):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        else:
            response = requests.post(url, headers=headers, json=json_data)
        
        if response.status_code == 200:
            print(f"[PASS] {name}")
            # print(response.json()) # Verbose
        else:
            print(f"[FAIL] {name}: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] {name}: {e}")

def main():
    token = get_auth_token()
    if not token:
        print("Skipping tests due to login failure")
        return

    print("--- Testing Risk Endpoints ---")
    
    # helper for full url
    def u(path): return f"{BASE_URL}{path}"

    test_endpoint("Correlation Financial", u("/api/risk/correlation/financial"), token)
    test_endpoint("Correlation Qualitative", u("/api/risk/correlation/qualitative"), token)
    test_endpoint("Get Stress Scenarios", u("/api/risk/scenarios"), token)
    
    # Test specific scenario (assuming "Funding Winter" exists)
    test_endpoint("Run Stress Test", u("/api/risk/stress-test/Funding%20Winter"), token, method="POST")
    
    test_endpoint("Concentration Sector", u("/api/risk/concentration/sector"), token)
    test_endpoint("Concentration Stage", u("/api/risk/concentration/stage"), token)
    test_endpoint("Concentration Power Law", u("/api/risk/concentration/power-law"), token)
    
    test_endpoint("Portfolio Health", u("/api/risk/health"), token)

if __name__ == "__main__":
    main()
