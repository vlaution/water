from backend.services.financial_data.alpha_vantage import AlphaVantageProvider
from unittest.mock import MagicMock

def test_provider():
    provider = AlphaVantageProvider()
    
    # Mock _make_request to avoid real API calls
    provider._make_request = MagicMock()
    
    def side_effect(function, symbol=None, **kwargs):
        if function == "INCOME_STATEMENT":
            return {"annualReports": [{"fiscalDateEnding": "2023-12-31", "totalRevenue": "100"}]}
        if function == "BALANCE_SHEET":
            return {"annualReports": [{"fiscalDateEnding": "2023-12-31", "totalCurrentAssets": "50"}]}
        if function == "CASH_FLOW":
            return {"annualReports": [{"fiscalDateEnding": "2023-12-31", "capitalExpenditures": "-5"}]}
        if function == "OVERVIEW":
            return {
                "Name": "Test Corp",
                "Industry": "Tech",
                "Sector": "Technology",
                "Description": "Desc",
                "Address": "123 St",
                "FullTimeEmployees": "1000",
                "FiscalYearEnd": "December"
            }
        return {}
        
    provider._make_request.side_effect = side_effect
    
    try:
        financials = provider.get_financials("TEST")
        print("Successfully fetched financials")
        print(financials.model_dump())
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_provider()
