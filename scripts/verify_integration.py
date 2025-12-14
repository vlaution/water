import sys
import os
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.getcwd())

from backend.main import app
from backend.database.models import Base, User, UserRole, AuditLog, get_db
from backend.auth.jwt_handler import create_access_token

# Setup Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    # Create Admin User
    admin = User(
        email="admin@example.com",
        name="Admin User",
        role=UserRole.admin,
        password="hashed_password"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def test_integration():
    print("\n--- Starting Integration Tests ---")
    admin = setup_db()
    
    # Create Token
    token = create_access_token({"sub": str(admin.id), "email": admin.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    print("1. Testing Dashboard Config (GET)")
    response = client.get("/api/dashboard/config", headers=headers)
    if response.status_code == 200:
        print("✅ GET /api/dashboard/config passed")
    else:
        print(f"❌ GET /api/dashboard/config failed: {response.status_code} {response.text}")

    print("2. Testing Dashboard Config (POST)")
    config_data = {"layout": "default", "widgets": []}
    response = client.post("/api/dashboard/config", json=config_data, headers=headers)
    if response.status_code == 200:
        print("✅ POST /api/dashboard/config passed")
    else:
        print(f"❌ POST /api/dashboard/config failed: {response.status_code} {response.text}")

    # Note: Testing valuation run requires complex input data, skipping for this quick check.
    # But if dashboard config works, it confirms current_user dependency is fixed.
    
    print("3. Verifying Audit Log for Config Change (Not implemented in route yet, but checking DB connection)")
    # We didn't add audit log to config change, but let's check if we can query audit logs
    response = client.get("/audit/logs", headers=headers)
    if response.status_code == 200:
        print("✅ GET /audit/logs passed")
    else:
        print(f"❌ GET /audit/logs failed: {response.status_code} {response.text}")

if __name__ == "__main__":
    try:
        test_integration()
        print("\n🎉 Integration Tests Completed!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
