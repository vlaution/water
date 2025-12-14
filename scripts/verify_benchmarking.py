import sys
import os
import json
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.benchmarking_service import BenchmarkingService
from backend.calculations.models import HistoricalFinancials
from backend.calculations.benchmarking_models import CompanyMetrics

def create_mock_financials(ticker, revenue_base=1000):
    # Create dummy financials with populated fields
    return HistoricalFinancials(
        years=[2023, 2022, 2021],
        revenue=[revenue_base, revenue_base*0.9, revenue_base*0.8],
        ebitda=[revenue_base*0.3, revenue_base*0.25, revenue_base*0.2],
        ebit=[revenue_base*0.2, revenue_base*0.15, revenue_base*0.1],
        net_income=[revenue_base*0.1, revenue_base*0.08, revenue_base*0.05],
        capex=[50, 45, 40],
        nwc=[100, 90, 80],
        
        total_assets=[revenue_base*2, revenue_base*1.8, revenue_base*1.6],
        total_equity=[revenue_base*1, revenue_base*0.9, revenue_base*0.8],
        total_debt=[revenue_base*0.5, revenue_base*0.4, revenue_base*0.3],
        current_assets=[revenue_base*0.5, revenue_base*0.4, revenue_base*0.3],
        current_liabilities=[revenue_base*0.3, revenue_base*0.25, revenue_base*0.2],
        cash_and_equivalents=[revenue_base*0.1, revenue_base*0.08, revenue_base*0.05],
        inventory=[revenue_base*0.1, revenue_base*0.09, revenue_base*0.08],
        receivables=[revenue_base*0.1, revenue_base*0.09, revenue_base*0.08],
        
        company_name=f"{ticker} Corp",
        sector="Technology"
    )

def test_benchmarking_with_mock():
    print("Initializing BenchmarkingService with Mock Provider...")
    
    # Mock the provider in benchmarking_service
    with patch('backend.services.benchmarking_service.provider') as mock_provider:
        # Setup mock return values
        def get_financials_side_effect(ticker):
            base = 1000
            if ticker == "AAPL": base = 5000
            elif ticker == "MSFT": base = 4000
            elif ticker == "GOOGL": base = 3000
            
            fin = create_mock_financials(ticker, base)
            
            # We also need to simulate the MetricsCalculator running, 
            # because BenchmarkingService calls provider.get_financials 
            # and expects .metrics to be populated (which AlphaVantageProvider does).
            # Since we are mocking the provider instance, we need to ensure 
            # the returned object has metrics.
            
            from backend.calculations.metrics_calculator import MetricsCalculator
            fin.metrics = MetricsCalculator.calculate_metrics(fin, ticker)
            return fin

        mock_provider.get_financials.side_effect = get_financials_side_effect
        
        service = BenchmarkingService()
        
        target = "AAPL"
        peers = ["MSFT", "GOOGL"]
        
        print(f"Fetching benchmark data for {target} vs {peers}...")
        try:
            response = service.get_comparison(target_ticker=target, peer_tickers=peers, use_sector=False)
            
            print("\n--- Target Metrics (AAPL) ---")
            # Print a few key metrics
            m = response.target
            print(f"ROE: {m.roe:.2%}")
            print(f"Net Margin: {m.net_margin:.2%}")
            print(f"Revenue Growth: {m.revenue_growth:.2%}")
            
            print("\n--- Peer Average ---")
            p = response.peer_avg
            print(f"ROE: {p.roe:.2%}")
            print(f"Net Margin: {p.net_margin:.2%}")
            
            print("\n--- Comparisons ---")
            for comp in response.comparisons:
                print(f"{comp.metric}: Target={comp.target_value:.2f}, PeerAvg={comp.peer_average:.2f}, Status={comp.status}, Percentile={comp.percentile:.0f}%")
                
            print("\nVerification Successful!")
            
        except Exception as e:
            print(f"\nVerification Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_benchmarking_with_mock()
