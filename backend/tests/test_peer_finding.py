import pytest
from unittest.mock import MagicMock, patch
from backend.services.peer_finding_service import PeerFindingService
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider

def test_peer_finding_direct_lookup():
    service = PeerFindingService()
    peers = service.find_peers("IBM")
    assert "MSFT" in peers
    assert "ORCL" in peers

def test_peer_finding_sector_fallback():
    service = PeerFindingService()
    peers = service.find_peers("UNKNOWN_TICKER", sector="Technology")
    assert "MSFT" in peers
    assert "AAPL" in peers

def test_get_company_multiples():
    provider = AlphaVantageProvider()
    
    # Mock _make_request
    provider._make_request = MagicMock()
    
    def side_effect(function, symbol=None, **kwargs):
        if function == "OVERVIEW":
            return {"MarketCapitalization": "1000000000"} # 1B
        elif function == "BALANCE_SHEET":
            return {
                "annualReports": [{
                    "shortTermDebt": "50000000", # 50M
                    "longTermDebt": "150000000", # 150M
                    "cashAndCashEquivalentsAtCarryingValue": "20000000" # 20M
                }]
            }
        elif function == "INCOME_STATEMENT":
            return {
                "annualReports": [{
                    "totalRevenue": "500000000", # 500M
                    "ebitda": "100000000" # 100M
                }]
            }
        return {}
        
    provider._make_request.side_effect = side_effect
    
    multiples = provider.get_company_multiples("TEST")
    
    # EV = Market Cap + Debt - Cash
    # EV = 1000 + (50+150) - 20 = 1000 + 180 = 1180M
    assert multiples["enterprise_value"] == 1180000000.0
    
    # EV/Revenue = 1180 / 500 = 2.36
    assert multiples["ev_revenue"] == 2.36
    
    # EV/EBITDA = 1180 / 100 = 11.80
    assert multiples["ev_ebitda"] == 11.80
