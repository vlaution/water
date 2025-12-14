import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.models import SessionLocal, ValuationRun, User, UserRole, init_db, Base, engine
from backend.auth.jwt_handler import create_access_token
import json
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_token(db_session):
    user = User(email="test@example.com", name="Test User", role=UserRole.admin)
    db_session.add(user)
    db_session.commit()
    return create_access_token({"sub": str(user.id), "email": user.email})

def test_excel_api_flow(db_session, auth_token):
    # 1. Create a Valuation
    val_data = {
        "id": "val_123",
        "company_name": "Test Corp",
        "mode": "manual",
        "input_data": json.dumps({"revenue": 1000, "currency": "USD"}),
        "results": json.dumps({"value": 5000}),
        "user_id": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db_session.add(ValuationRun(**val_data))
    db_session.commit()

    headers = {"Authorization": f"Bearer {auth_token}"}

    # 2. Test Get Companies
    res = client.get("/api/excel/companies", headers=headers)
    assert res.status_code == 200
    assert "Test Corp" in res.json()

    # 3. Test Export
    res = client.get("/api/excel/valuation/val_123/export", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["company_name"] == "Test Corp"
    assert data["inputs"]["revenue"] == 1000
    assert "validation" in data
    assert "currency" in data["validation"]
    etag = res.headers["ETag"]
    assert etag is not None

    # 4. Test Import (Success)
    update_payload = {
        "id": "val_123",
        "inputs": {"revenue": 2000, "currency": "USD"}
    }
    # We need to quote the ETag for If-Match usually, but our API handles it
    res = client.post("/api/excel/import", json=update_payload, headers={**headers, "If-Match": etag})
    assert res.status_code == 200
    
    # Verify Update
    val = db_session.query(ValuationRun).filter_by(id="val_123").first()
    assert json.loads(val.input_data)["revenue"] == 2000

    # 5. Test Import (Conflict)
    # Try to update with the OLD etag (which should now be stale)
    res = client.post("/api/excel/import", json=update_payload, headers={**headers, "If-Match": etag})
    assert res.status_code == 412  # Precondition Failed
