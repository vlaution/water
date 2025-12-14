import pytest
from unittest.mock import MagicMock, patch
from backend.services.validation.anomaly_detection import AnomalyDetectionService
from backend.calculations.models import ValuationInput, DCFInput, ProjectionAssumptions, HistoricalFinancials

@pytest.fixture
def mock_env_vars(monkeypatch):
    monkeypatch.setenv("ALPHA_VANTAGE_API_KEY", "test_key")
    monkeypatch.setenv("GROQ_API_KEY", "test_key")

def test_detect_outliers_normal():
    service = AnomalyDetectionService()
    # Normal revenue growth (5%)
    result = service.detect_outliers(0.05, "revenue_growth")
    assert not result.is_outlier
    assert result.severity == "normal"

def test_detect_outliers_warning():
    service = AnomalyDetectionService()
    # High revenue growth (30%) -> Z-Score = (0.30 - 0.05) / 0.10 = 2.5
    result = service.detect_outliers(0.30, "revenue_growth")
    assert result.is_outlier
    assert result.severity == "warning"

def test_detect_outliers_critical():
    service = AnomalyDetectionService()
    # Very high revenue growth (50%) -> Z-Score = (0.50 - 0.05) / 0.10 = 4.5
    result = service.detect_outliers(0.50, "revenue_growth")
    assert result.is_outlier
    assert result.severity == "critical"

@patch("backend.services.validation.anomaly_detection.Groq")
def test_validate_assumptions_with_ai(mock_groq, mock_env_vars):
    # Mock Groq response
    mock_client = MagicMock()
    mock_groq.return_value = mock_client
    mock_client.chat.completions.create.return_value.choices[0].message.content = "AI Summary: High revenue growth detected."
    
    service = AnomalyDetectionService()
    
    # Create dummy input with one outlier
    projections = ProjectionAssumptions(
        revenue_growth_start=0.50, # Critical outlier
        ebitda_margin_start=0.20,  # Normal
        terminal_growth_rate=0.025, # Normal
        discount_rate=0.08,        # Normal
        
        # Required fields (dummy values)
        revenue_growth_end=0.02,
        ebitda_margin_end=0.20,
        tax_rate=0.25,
        capex_percent_revenue=0.05,
        terminal_exit_multiple=10.0
    )
    
    # Minimal required structure for ValuationInput
    dcf_input = DCFInput(
        projections=projections,
        historical=HistoricalFinancials(
            years=[2020, 2021, 2022],
            revenue=[100, 110, 120],
            ebitda=[20, 22, 24],
            ebit=[15, 17, 19],
            net_income=[10, 12, 14],
            capex=[5, 5, 6],
            nwc=[10, 11, 12]
        ),
        net_debt=50.0,
        shares_outstanding=10.0
    )
    
    val_input = ValuationInput(
        company_name="Test Co",
        dcf_input=dcf_input
    )
    
    response = service.validate_assumptions(val_input)
    
    assert len(response.anomalies) == 1
    assert response.anomalies[0].field == "revenue_growth"
    assert response.confidence_score < 1.0
    assert "AI Summary" in response.summary

if __name__ == "__main__":
    # Manually run tests if executed as script
    # Note: mocking might not work perfectly in this simple script runner without pytest fixtures
    # So we'll rely on pytest
    print("Please run with: python -m pytest backend/tests/test_anomaly_detection.py")
