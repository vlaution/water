import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.models import SessionLocal, User, UserRole, Base, engine
from backend.auth.jwt_handler import create_access_token
import os

client = TestClient(app)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_token(db_session):
    # Ensure test user exists
    user = db_session.query(User).filter_by(email="test_parser@example.com").first()
    if not user:
        user = User(email="test_parser@example.com", name="Test Parser", role=UserRole.analyst, hashed_password="hashed")
        db_session.add(user)
        db_session.commit()
    
    return create_access_token({"sub": str(user.id), "email": user.email})

def test_upload_excel_success(auth_token):
    # Path to the actual file on user's desktop
    file_path = r"C:\Users\Abhiram\Desktop\water\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
    
    if not os.path.exists(file_path):
        pytest.skip(f"File not found: {file_path}")

    with open(file_path, "rb") as f:
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Upload
        files = {"file": ("test_valuation.xlsm", f, "application/vnd.ms-excel.sheet.macroEnabled.12")}
        res = client.post("/api/excel/upload", headers=headers, files=files)
        
        # Verify Response
        assert res.status_code == 200, f"Response: {res.text}"
        data = res.json()
        assert data["status"] == "success"
        
        parsed_data = data["data"]
        assert parsed_data["company_name"] == "ABC_Fintech_Inc."
        assert parsed_data["currency"] == "USD"
        assert parsed_data["tax_rate"] == 0.25
        assert "USA" in parsed_data["geography"]

def test_upload_invalid_file_type(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {"file": ("test.txt", b"dummy content", "text/plain")}
    res = client.post("/api/excel/upload", headers=headers, files=files)
    assert res.status_code == 400
    assert "Invalid file type" in res.json()["detail"]
