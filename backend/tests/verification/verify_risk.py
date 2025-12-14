import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.jwt_handler import create_access_token
from unittest.mock import MagicMock, patch

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "1", "email": "test@example.com"})
    return {"Authorization": f"Bearer {token}"}

def test_financial_correlation(auth_headers):
    # Mock DB session and CorrelationService
    with patch("backend.api.risk_routes.CorrelationService") as MockService:
        service_instance = MockService.return_value
        service_instance.calculate_correlation_matrix.return_value = {
            "companies": ["A", "B"],
            "matrix": [[1.0, 0.5], [0.5, 1.0]],
            "metrics_used": ["revenue_growth", "ebitda_margin"]
        }
        
        response = client.get("/api/risk/correlation/financial", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "matrix" in data
        assert data["companies"] == ["A", "B"]
        print("\n✅ Financial Correlation API Verified")

def test_qualitative_correlation(auth_headers):
    with patch("backend.api.risk_routes.CorrelationService") as MockService:
        service_instance = MockService.return_value
        service_instance.calculate_qualitative_similarity.return_value = {
            "companies": ["A", "B"],
            "matrix": [[1.0, 0.0], [0.0, 1.0]],
            "metrics_used": ["industry"]
        }
        
        response = client.get("/api/risk/correlation/qualitative", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "matrix" in data
        print("\n✅ Qualitative Correlation API Verified")
