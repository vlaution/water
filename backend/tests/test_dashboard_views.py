import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.api.dashboard_models import (
    ExecutiveViewResponse,
    FinanceViewResponse,
    StrategyViewResponse,
    InvestorViewResponse
)

client = TestClient(app)

# Mock user for auth
@pytest.fixture
def mock_user():
    return {"id": 1, "email": "test@example.com"}

@pytest.fixture
def mock_dashboard_service():
    with patch("backend.api.routes.DashboardService") as mock:
        yield mock

@pytest.fixture
def override_dependency(mock_user):
    from backend.api.routes import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides = {}

def test_get_executive_view(mock_dashboard_service, override_dependency):
    # Setup mock return value
    mock_instance = mock_dashboard_service.return_value
    mock_response = ExecutiveViewResponse(
        total_portfolio_value=1000000,
        active_companies=5,
        average_confidence=85,
        top_opportunities=[],
        recent_activity=[]
    )
    mock_instance.get_executive_view.return_value = mock_response

    response = client.get("/api/dashboard/executive")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_portfolio_value"] == 1000000
    assert data["active_companies"] == 5
    mock_instance.get_executive_view.assert_called_once()

def test_get_finance_view(mock_dashboard_service, override_dependency):
    mock_instance = mock_dashboard_service.return_value
    mock_response = FinanceViewResponse(
        company_name="Test Company",
        enterprise_value=500000,
        equity_value=400000,
        wacc=0.1,
        multiples={"ev_ebitda": 10},
        benchmarks={"peer_avg_ev_ebitda": 12}
    )
    mock_instance.get_finance_view.return_value = mock_response

    response = client.get("/api/dashboard/finance/test_run_id")
    
    assert response.status_code == 200
    data = response.json()
    assert data["enterprise_value"] == 500000
    mock_instance.get_finance_view.assert_called_once_with("test_run_id")

def test_get_strategy_view(mock_dashboard_service, override_dependency):
    mock_instance = mock_dashboard_service.return_value
    mock_response = StrategyViewResponse(
        company_name="Test Company",
        scenarios=[],
        sensitivity_analysis={"growth": [0.1, 0.2]},
        strategic_alerts=[]
    )
    mock_instance.get_strategy_view.return_value = mock_response

    response = client.get("/api/dashboard/strategy/test_run_id")
    
    assert response.status_code == 200
    data = response.json()
    assert "sensitivity_analysis" in data
    mock_instance.get_strategy_view.assert_called_once_with("test_run_id")

def test_get_investor_view(mock_dashboard_service, override_dependency):
    mock_instance = mock_dashboard_service.return_value
    mock_response = InvestorViewResponse(
        company_name="Test Company",
        deal_readiness_score=90,
        key_risks=[],
        upside_potential=100000,
        exit_scenarios=[]
    )
    mock_instance.get_investor_view.return_value = mock_response

    response = client.get("/api/dashboard/investor/test_run_id")
    
    assert response.status_code == 200
    data = response.json()
    assert data["deal_readiness_score"] == 90
    mock_instance.get_investor_view.assert_called_once_with("test_run_id")
