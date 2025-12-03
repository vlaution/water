import pytest
from unittest.mock import MagicMock, Mock
from backend.services.dashboard_service import DashboardService
from backend.database.models import ValuationRun
import json

def test_get_overview_view_success():
    # Mock DB session
    mock_db = MagicMock()
    
    # Mock ValuationRun
    mock_run = Mock(spec=ValuationRun)
    mock_run.id = "test-run-id"
    mock_run.company_name = "Test Corp"
    mock_run.results = json.dumps({
        "enterprise_value": 1000000,
        "equity_value": 800000,
        "audit_issues": [{"message": "Test Issue", "severity": "error"}],
        "dcf_valuation": {
            "enterprise_value": 1000000,
            "terminal_value_present": 600000,
            "explicit_period_present": 400000
        },
        "gpc_valuation": {"enterprise_value": 950000},
        "fcfe_valuation": {"equity_value": 750000},
        "anav_valuation": {"net_asset_value": 500000},
        "lbo_valuation": {"implied_valuation": 900000}
    })
    mock_run.input_data = json.dumps({
        "method_weights": {"dcf": 0.5, "gpc": 0.5},
        "dcf_input": {
            "historical": {
                "revenue": [100, 110, 120],
                "ebitda": [10, 11, 12]
            },
            "projections": {}
        }
    })
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_run
    
    service = DashboardService(mock_db)
    result = service.get_overview_view("test-run-id")
    
    assert result.company_name == "Test Corp"
    assert result.valuation_summary["enterprise_value"] == 1000000
    assert result.valuation_summary["equity_value"] == 800000
    assert result.credibility_score["score"] < 100 # Should be penalized for audit issue
    assert len(result.risks) == 1
    assert result.risks[0] == "Test Issue"
    assert result.terminal_value_split["terminal_value"] == 600000
    assert result.forecast["revenue"] == [100, 110, 120]
    assert result.input_summary["method_weights"]["dcf"] == 0.5

def test_get_overview_view_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    service = DashboardService(mock_db)
    
    with pytest.raises(ValueError, match="Run not found"):
        service.get_overview_view("non-existent-id")
