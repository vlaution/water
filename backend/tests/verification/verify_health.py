import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.jwt_handler import create_access_token
from unittest.mock import MagicMock, patch
from backend.calculations.risk_models import PortfolioHealthResponse, CompanyHealthResult

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "1", "email": "test@example.com"})
    return {"Authorization": f"Bearer {token}"}

def test_portfolio_health(auth_headers):
    with patch("backend.api.risk_routes.HealthService") as MockService:
        service_instance = MockService.return_value
        service_instance.calculate_portfolio_health.return_value = PortfolioHealthResponse(
            avg_runway_months=18.5,
            avg_data_quality=85.0,
            total_companies=10,
            healthy_companies=8,
            at_risk_companies=2,
            company_results=[
                CompanyHealthResult(
                    company_name="Healthy Co",
                    runway_months=24.0,
                    data_quality_score=100.0,
                    red_flags=[]
                ),
                CompanyHealthResult(
                    company_name="Risky Co",
                    runway_months=4.0,
                    data_quality_score=50.0,
                    red_flags=["Critical Runway"]
                )
            ]
        )
        
        response = client.get("/api/risk/health", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["avg_runway_months"] == 18.5
        assert data["at_risk_companies"] == 2
        assert len(data["company_results"]) == 2
        print("\n✅ Portfolio Health API Verified")
