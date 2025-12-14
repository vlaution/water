import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.jwt_handler import create_access_token
from unittest.mock import MagicMock, patch
from backend.calculations.risk_models import StressScenario, PortfolioStressTestResponse

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "1", "email": "test@example.com"})
    return {"Authorization": f"Bearer {token}"}

def test_get_scenarios(auth_headers):
    with patch("backend.api.risk_routes.StressTestService") as MockService:
        service_instance = MockService.return_value
        service_instance.get_scenarios.return_value = [
            StressScenario(name="Test Scenario", description="Test", shocks={"revenue_growth": -0.1})
        ]
        
        response = client.get("/api/risk/scenarios", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Scenario"
        print("\n✅ Get Scenarios API Verified")

def test_run_stress_test(auth_headers):
    with patch("backend.api.risk_routes.StressTestService") as MockService:
        service_instance = MockService.return_value
        service_instance.run_stress_test.return_value = PortfolioStressTestResponse(
            scenario="Test Scenario",
            total_base_value=100.0,
            total_stressed_value=90.0,
            total_change_percent=-0.1,
            company_results=[]
        )
        
        response = client.post("/api/risk/stress-test/Test%20Scenario", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["scenario"] == "Test Scenario"
        assert data["total_stressed_value"] == 90.0
        print("\n✅ Run Stress Test API Verified")
