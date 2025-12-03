import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider

client = TestClient(app)

@pytest.fixture
def mock_av_response():
    return {
        "INCOME_STATEMENT": {
            "annualReports": [
                {
                    "fiscalDateEnding": "2023-12-31",
                    "totalRevenue": "100",
                    "netIncome": "10",
                    "ebit": "15",
                    "ebitda": "20"
                }
            ]
        },
        "BALANCE_SHEET": {
            "annualReports": [
                {
                    "fiscalDateEnding": "2023-12-31",
                    "totalCurrentAssets": "50",
                    "totalCurrentLiabilities": "30"
                }
            ]
        },
        "CASH_FLOW": {
            "annualReports": [
                {
                    "fiscalDateEnding": "2023-12-31",
                    "capitalExpenditures": "-5"
                }
            ]
        },
        "OVERVIEW": {
            "Beta": "1.2",
            "Name": "International Business Machines",
            "Industry": "Computer & Office Equipment",
            "Sector": "Technology",
            "Description": "IBM is a tech giant.",
            "Address": "Armonk, NY",
            "FullTimeEmployees": "280000",
            "FiscalYearEnd": "December"
        },
        "TREASURY_YIELD": {
            "data": [{"value": "4.5"}]
        }
    }

@patch("backend.services.financial_data.alpha_vantage.requests.get")
def test_get_financials_success(mock_get, mock_av_response):
    # Setup mock to return different data based on function param
    def side_effect(url, params, timeout):
        function = params.get("function")
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_av_response.get(function, {})
        mock_resp.raise_for_status.return_value = None
        return mock_resp

    mock_get.side_effect = side_effect

    response = client.get("/api/financials/IBM")
    assert response.status_code == 200
    data = response.json()
    
    assert data["years"] == [2023]
    assert data["revenue"] == [100.0]
    assert data["ebitda"] == [20.0]
    assert data["nwc"] == [20.0] # 50 - 30
    
    # Profile Check
    assert data["company_name"] == "International Business Machines"
    assert data["industry"] == "Computer & Office Equipment"
    assert data["employees"] == 280000

@patch("backend.services.financial_data.alpha_vantage.requests.get")
def test_get_market_data_success(mock_get, mock_av_response):
    def side_effect(url, params, timeout):
        function = params.get("function")
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_av_response.get(function, {})
        mock_resp.raise_for_status.return_value = None
        return mock_resp

    mock_get.side_effect = side_effect

    response = client.get("/api/market-data/IBM")
    assert response.status_code == 200
    data = response.json()
    
    assert data["beta"] == 1.2
    assert data["risk_free_rate"] == 0.045
    assert data["market_risk_premium"] == 0.055
    # WACC check: 0.6 * (0.045 + 1.2*0.055) + 0.4 * (0.045+0.02) * (1-0.21)
    # Ke = 0.045 + 0.066 = 0.111
    # Kd = 0.065
    # Wacc = 0.6 * 0.111 + 0.4 * 0.065 * 0.79 = 0.0666 + 0.02054 = 0.08714
    assert abs(data["wacc"] - 0.0871) < 0.001

@patch("backend.services.financial_data.alpha_vantage.requests.get")
def test_api_error_handling(mock_get):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"Error Message": "Invalid API call"}
    mock_resp.raise_for_status.return_value = None
    mock_get.return_value = mock_resp

    response = client.get("/api/financials/INVALID")
    assert response.status_code == 400
    assert "Alpha Vantage API Error" in response.json()["detail"]
