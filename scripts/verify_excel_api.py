import requests
import json
from backend.auth.jwt_handler import create_access_token
from backend.database.models import SessionLocal, User, ValuationRun

BASE_URL = "http://127.0.0.1:8002"

def verify_excel_api():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("❌ No user found to generate token")
        return
        
    token = create_access_token(data={"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔑 Generated token for user: {user.email}")
    
    # 3. Get a Valuation ID (Move up to close session early)
    run = db.query(ValuationRun).first()
    run_id = run.id if run else None
    
    db.close() # Close session to release any locks
    
    if not run_id:
        print("❌ No valuation runs found")
        return
    print("\nTesting GET /api/excel/companies...")
    try:
        res = requests.get(f"{BASE_URL}/api/excel/companies", headers=headers, timeout=10)
        if res.status_code == 200:
            print(f"✅ Success: {res.json()}")
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

    # 3. Get a Valuation ID
    if not run_id:
        print("❌ No valuation runs found")
        return

    print(f"\nTesting GET /api/excel/valuation/{run_id}/export...")
    try:
        res = requests.get(f"{BASE_URL}/api/excel/valuation/{run_id}/export", headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            etag = res.headers.get("ETag")
            print(f"✅ Export Success. ETag: {etag}")
            
            # 4. Test Import (Update)
            print(f"\nTesting POST /api/excel/import with ETag {etag}...")
            
            import_payload = data
            if "inputs" in import_payload:
                 import_payload["inputs"]["wacc"] = 0.12 
            
            headers["If-Match"] = etag
            res = requests.post(f"{BASE_URL}/api/excel/import", json=import_payload, headers=headers, timeout=10)
            if res.status_code == 200:
                print(f"✅ Import Success: {res.json()}")
            else:
                print(f"❌ Import Failed: {res.status_code} - {res.text}")
                
            # 5. Test Optimistic Locking (Fail case)
            print("\nTesting Optimistic Locking (Should Fail)...")
            headers["If-Match"] = '"old-etag"'
            res = requests.post(f"{BASE_URL}/api/excel/import", json=import_payload, headers=headers, timeout=10)
            if res.status_code == 412:
                print("✅ Correctly rejected with 412 Precondition Failed")
            else:
                print(f"❌ Expected 412, got {res.status_code}")

        else:
            print(f"❌ Export Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    verify_excel_api()
