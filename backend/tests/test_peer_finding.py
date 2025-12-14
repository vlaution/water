import pytest
from backend.services.peer_finding_service import PeerFindingService

def test_peer_finding_exact_match():
    service = PeerFindingService()
    # AAPL (Tech, Consumer Electronics)
    # Should find peers in same industry/sector
    peers = service.find_peers("AAPL", limit=3)
    
    assert "MSFT" in peers or "GOOGL" in peers or "NVDA" in peers
    assert "AAPL" not in peers
    assert len(peers) <= 3

def test_peer_finding_industry_match():
    service = PeerFindingService()
    # NVDA (Semiconductors)
    # Should prefer AMD, INTC, QCOM over MSFT
    peers = service.find_peers("NVDA", limit=3)
    
    assert "AMD" in peers
    assert "INTC" in peers
    # MSFT is software, so it should be lower priority than semis if available

def test_peer_finding_market_cap_sort():
    service = PeerFindingService()
    # JPM (Big Bank)
    # Should find BAC (Big Bank) before a small bank if we had one
    # In our dataset, BAC is closest in size in Financials
    peers = service.find_peers("JPM", limit=1)
    assert peers[0] == "BAC" or peers[0] == "V" # V is also huge

def test_peer_finding_fallback_sector():
    service = PeerFindingService()
    # Unknown ticker, but sector provided
    peers = service.find_peers("UNKNOWN_TICKER", sector="Energy", limit=2)
    assert "CVX" in peers # Only energy stock in our list currently
    
def test_peer_finding_unknown():
    service = PeerFindingService()
    peers = service.find_peers("UNKNOWN_TICKER")
    assert peers == ["SPY", "QQQ"]
