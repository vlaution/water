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

def test_sector_concentration(auth_headers):
    with patch("backend.api.risk_routes.ConcentrationService") as MockService:
        service_instance = MockService.return_value
        service_instance.get_sector_concentration.return_value = {
            "labels": ["SaaS", "FinTech"],
            "values": [1000000.0, 500000.0],
            "total_value": 1500000.0
        }
        
        response = client.get("/api/risk/concentration/sector", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "labels" in data
        assert "values" in data
        assert data["total_value"] == 1500000.0
        print("\n✅ Sector Concentration API Verified")

def test_stage_concentration(auth_headers):
    with patch("backend.api.risk_routes.ConcentrationService") as MockService:
        service_instance = MockService.return_value
        service_instance.get_stage_concentration.return_value = {
            "labels": ["Seed", "Series A"],
            "values": [200000.0, 800000.0],
            "total_value": 1000000.0
        }
        
        response = client.get("/api/risk/concentration/stage", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "labels" in data
        print("\n✅ Stage Concentration API Verified")

def test_power_law_metrics(auth_headers):
    with patch("backend.api.risk_routes.ConcentrationService") as MockService:
        service_instance = MockService.return_value
        service_instance.get_power_law_metrics.return_value = {
            "gini_coefficient": 0.75,
            "top_3_percent": 0.80,
            "is_power_law_compliant": True
        }
        
        response = client.get("/api/risk/concentration/power-law", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["gini_coefficient"] == 0.75
        assert data["is_power_law_compliant"] is True
        print("\n✅ Power Law Metrics API Verified")
