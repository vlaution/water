import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.benchmarking_service import BenchmarkingService

def verify_lookup():
    service = BenchmarkingService()
    
    # Test 1: NVDA (Technology)
    print("\n--- Testing NVDA (Technology) ---")
    peers = service._get_sector_peers("NVDA")
    print(f"Peers: {peers}")
    
    assert "AMD" in peers, "AMD should be a peer of NVDA"
    assert "INTC" in peers, "INTC should be a peer of NVDA"
    assert "JPM" not in peers, "JPM (Financial) should NOT be a peer of NVDA"
    print("✅ NVDA Sector Lookup Passed")
    
    # Test 2: JPM (Financial Services)
    print("\n--- Testing JPM (Financial Services) ---")
    peers = service._get_sector_peers("JPM")
    print(f"Peers: {peers}")
    
    assert "GS" in peers, "GS should be a peer of JPM"
    assert "BAC" in peers, "BAC should be a peer of JPM"
    assert "AAPL" not in peers, "AAPL (Tech) should NOT be a peer of JPM"
    print("✅ JPM Sector Lookup Passed")
    
    # Test 3: Unknown Ticker (Fallback)
    print("\n--- Testing UNKNOWN (Fallback) ---")
    peers = service._get_sector_peers("UNKNOWN")
    print(f"Peers: {peers}")
    assert "MSFT" in peers, "Should return fallback peers"
    print("✅ Fallback Logic Passed")

if __name__ == "__main__":
    verify_lookup()
