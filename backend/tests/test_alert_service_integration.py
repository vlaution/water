import pytest
from unittest.mock import MagicMock
from backend.services.alerting.service import AlertService
from backend.database.models import Company, DecisionRecord
from backend.services.decision_engine import DecisionEngine

def test_alert_service_integration():
    # 1. Mock DB Session
    mock_db = MagicMock()
    
    # Mock Company
    mock_company = Company(ticker="TEST1", name="Test Corp")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_company
    
    # 2. Setup Service
    service = AlertService()
    
    # 3. Payload
    payload = {
        "type": "covenant_breach_check",
        "company_id": "TEST1",
        "metrics": {"EBITDA": 100.0, "Debt/EBITDA": 6.0}, # Breach > 4.5
        "context": {
            "recurrence_count": 1,
            "data_freshness_days": 1
        }
    }
    
    # 4. Execute
    result = service.process_financial_alert(payload, mock_db)
    
    # 5. Verify
    assert result["status"] == "decision_created"
    assert "decision_id" in result
    
    # Check DB Add called
    assert mock_db.add.called
    args = mock_db.add.call_args[0][0]
    assert isinstance(args, DecisionRecord)
    assert args.signal == "covenant_breach"
    assert args.company_id == "TEST1"
