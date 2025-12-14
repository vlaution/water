
import requests
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

def test_heatmap_updates():
    print("Testing Visualization Enhancements Backend...")
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch Heatmap and check for new fields
    print("\n--- Heatmap Fields Check ---")
    url = f"{BASE_URL}/api/dashboard/portfolio/heatmap"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        items = response.json()
        if len(items) > 0:
            sample = items[0]
            print(f"Found {len(items)} items.")
            print(f"Sample Run ID: {sample.get('run_id')}")
            print(f"Sample Sector: {sample.get('sector')}")
            print(f"Sample Region: {sample.get('region')}")
            
            # Debug: Print full item to see if anything else is there
            # print(sample)
            
            if not sample.get('run_id'):
                print("FAILURE: run_id missing!")
            if not sample.get('sector'):
                 print("FAILURE: sector missing!")
        else:
            print("No items to check.")
    else:
        print(f"Failed to fetch heatmap: {response.status_code}")
        
    # 2. Test Filtering (Mocking sector if data is default)
    # Since our mock/default is "Technology", let's try to filter for it and then for something else
    print("\n--- Filtering Check ---")
    
    # Matching Filter
    response_tech = requests.get(f"{url}?sector=Technology", headers=headers)
    count_tech = len(response_tech.json())
    print(f"Filter 'Technology': {count_tech} items")
    
    # Non-Matching Filter
    response_mining = requests.get(f"{url}?sector=Mining", headers=headers)
    count_mining = len(response_mining.json())
    print(f"Filter 'Mining': {count_mining} items")
    
    if count_tech > 0 and count_mining == 0:
        print("SUCCESS: Filtering logic works.")
    elif count_tech == 0:
        print("WARNING: No data found for 'Technology' (Default). Verify data seeding.")
    else:
        print("FAILURE: Filtering logic ignored. 'Mining' returned results.")

    # 3. Check Overview Data (for Breakdown/Split)
    print("\n--- Overview Data Check ---")
    if len(items) > 0:
        run_id = items[0].get("run_id")
        print(f"Checking Overview for Run ID: {run_id}")
        url_overview = f"{BASE_URL}/api/dashboard/overview/{run_id}"
        
        resp_ov = requests.get(url_overview, headers=headers)
        if resp_ov.status_code == 200:
            ov_data = resp_ov.json()
            
            # DEBUG: Print data keys to understand structure
            # But wait, endpoint returns OverviewViewResponse, not raw JSON results.
            # I need to fetch the raw run details to debug the structure.
            print(f"Overview Response Keys: {ov_data.keys()}")
            
            # Fetch Raw Run Details
            url_details = f"{BASE_URL}/runs/{run_id}"
            resp_details = requests.get(url_details, headers=headers)
            if resp_details.status_code == 200:
                raw_results = resp_details.json().get("results", {})
                print(f"\nRaw Results Keys: {list(raw_results.keys())}")
                if "dcf_valuation" in raw_results:
                     print(f"DCF Keys: {raw_results['dcf_valuation'].keys()}")
                else:
                     print("DCF Valuation Key MISSING in results.")
            
            breakdown = ov_data.get("method_breakdown", {})
            tv_split = ov_data.get("terminal_value_split", {})
            
            print(f"Method Breakdown: {breakdown}")
            print(f"TV Split: {tv_split}")
            
            # Check if any value is > 0
            has_breakdown = any(v > 0 for v in breakdown.values())
            has_tv = any(v > 0 for v in tv_split.values())
            
            if has_breakdown:
                print("SUCCESS: Method Breakdown has data.")
            else:
                print("FAILURE: Method Breakdown is all zeros.")
                
            if has_tv:
                print("SUCCESS: TV Split has data.")
            else:
                print("FAILURE: TV Split is all zeros.")
        else:
            print(f"Failed to fetch Overview: {resp_ov.status_code}") 

    # 4. Check Timeline Annotations
    print("\n--- Timeline Annotations Check ---")
    url_timeline = f"{BASE_URL}/api/dashboard/portfolio/timeline"
    resp_timeline = requests.get(url_timeline, headers=headers)
    
    if resp_timeline.status_code == 200:
        timeline_items = resp_timeline.json()
        print(f"Fetched {len(timeline_items)} timeline items.")
        
        has_annotation = False
        for item in timeline_items:
            if item.get("annotation"):
                has_annotation = True
                print(f"FOUND Annotation: {item['annotation']}")
                break
        
        if has_annotation:
            print("SUCCESS: Timeline returns annotations.")
        else:
            print("WARNING: No annotations found in timeline data. Check mock data dates vs run dates.")
    else:
        print(f"Failed to fetch timeline: {resp_timeline.status_code}")

if __name__ == "__main__":
    test_heatmap_updates()
