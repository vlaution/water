
import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/auth/login"

def login():
    try:
        response = requests.post(LOGIN_URL, json={"email": "portfolio_test@example.com", "password": "password123"})
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"Login failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Login error: {e}")
        sys.exit(1)

def measure_request(url, token, label):
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    response = requests.get(url, headers=headers)
    end = time.time()
    duration = (end - start) * 1000
    
    if response.status_code == 200:
        print(f"[{label}] Status: 200 OK | Time: {duration:.2f}ms")
        return response.json()
    else:
        print(f"[{label}] Failed: {response.status_code} | {response.text}")
        return None

def main():
    print("Testing Performance Improvements...")
    token = login()
    
    # 1. Test Summary (First Hit - Cache Miss)
    print("\n--- Summary Endpoint (Cache Miss) ---")
    data1 = measure_request(f"{BASE_URL}/api/dashboard/portfolio/summary", token, "Summary 1st")
    
    # 2. Test Summary (Second Hit - Cache Hit)
    print("\n--- Summary Endpoint (Cache Hit) ---")
    data2 = measure_request(f"{BASE_URL}/api/dashboard/portfolio/summary", token, "Summary 2nd")
    
    # 3. Test Granular Widgets
    print("\n--- Granular Widgets ---")
    measure_request(f"{BASE_URL}/api/dashboard/portfolio/heatmap?limit=10", token, "Heatmap")
    measure_request(f"{BASE_URL}/api/dashboard/portfolio/acquisition-potential", token, "Acquisition")
    measure_request(f"{BASE_URL}/api/dashboard/portfolio/timeline", token, "Timeline")
    measure_request(f"{BASE_URL}/api/dashboard/portfolio/risk-matrix", token, "Risk Matrix")

if __name__ == "__main__":
    main()
