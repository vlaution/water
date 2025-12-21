import sys
import os
import time
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), '..'))
sys.path.append(os.getcwd())

from backend.services.data.connectors import DataConnectors
from backend.models.data_point import DataSource

def run_shadow_mode():
    print("--- SHADOW MODE ACTIVATED ---")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("Connecting to External Reality Sources...")
    
    connectors = DataConnectors()
    
    # 1. Macro Check
    print("\n[1] Checking Macro Reality (FRED)...")
    try:
        fred_data = connectors.fetch_fred_metric("T10Y2Y") # 10Y-2Y Spread
        if fred_data:
            print(f"    ✓ CONNECTED: {fred_data.source.value}")
            print(f"    -> 10Y-2Y Spread: {fred_data.value}")
            print(f"    -> Authority: {fred_data.authority_level}")
            print(f"    -> Freshness: {fred_data.freshness_hours} hours old")
        else:
            print("    ✗ FAILED to connect to FRED.")
    except Exception as e:
        print(f"    ✗ ERROR: {e}")

    # 2. Market Context
    print("\n[2] Checking Market Context (Alpha Vantage)...")
    try:
        mkt_data = connectors.fetch_market_volatility("SPY")
        if mkt_data:
            print(f"    ✓ CONNECTED: {mkt_data.source.value}")
            print(f"    -> SPY Daily Change: {mkt_data.value}%")
            print(f"    -> Authority: {mkt_data.authority_level}")
        else:
            print("    ✗ FAILED to connect to Alpha Vantage.")
    except Exception as e:
        print(f"    ✗ ERROR: {e}")

    # 3. Regulatory Check
    print("\n[3] Checking Regulatory Pulse (SEC EDGAR)...")
    try:
        sec_data = connectors.check_sec_filing("AAPL") # Using Proxy for connectivity
        if sec_data:
            print(f"    ✓ CONNECTED: {sec_data.source.value}")
            print(f"    -> Filing Found: {sec_data.timestamp.strftime('%Y-%m-%d')}")
            print(f"    -> Authority: {sec_data.authority_level}")
            print(f"    -> Link: {sec_data.citation_url}")
        else:
            print("    ✗ FAILED to connect to SEC.")
    except Exception as e:
        print(f"    ✗ ERROR: {e}")

    print("\n--- SHADOW MODE COMPLETE ---")
    print("System is successfully listing to the outside world.")

if __name__ == "__main__":
    run_shadow_mode()
