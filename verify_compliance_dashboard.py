import sys
import os
from fastapi.testclient import TestClient

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.main import app

# from backend.main import app # already imported above
from backend.database.models import get_db, Base, AuditLog
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Setup In-Memory DB for Testing
try:
    os.remove("./test_dashboard.db")
except FileNotFoundError:
    pass

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dashboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
print(f"Creating tables for: {list(Base.metadata.tables.keys())}")
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def verify_dashboard_api():
    print("=== Testing Compliance Dashboard API ===")
    
    val_id = "test_val_1"
    
    # 1. Call Endpoint
    print(f"\n[1] GET /api/compliance/dashboard-stats/{val_id}")
    try:
        response = client.get(f"/api/compliance/dashboard-stats/{val_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("PASS: Endpoint returned 200 OK")
            print(f"Response Keys: {list(data.keys())}")
            
            # 2. Check Structure
            checks = data.get("status_checks", {})
            heatmap = data.get("risk_heatmap", {})
            
            if "asc_820" in checks and "high" in heatmap:
                print("PASS: Structure matches expectations.")
                print(f"Risk Heatmap: {heatmap}")
                print(f"Doc Completeness: {data.get('doc_completeness')}%")
            else:
                print("FAIL: Missing keys in response.")
        else:
            print(f"FAIL: Status Code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"FAIL: Exception calling API: {e}")

if __name__ == "__main__":
    verify_dashboard_api()
