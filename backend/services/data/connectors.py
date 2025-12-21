import os
import requests
from datetime import datetime
from typing import Dict, Any, Optional
from backend.models.data_point import DataPoint, DataSource

class DataConnectors:
    def __init__(self):
        self.fred_key = os.getenv("FRED_API_KEY")
        self.av_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        # Ensure we have a valid User-Agent for SEC
        self.sec_user_agent = os.getenv("SEC_USER_AGENT", "csgoby47@gmail.com") 
        
        # Simple In-Memory Cache to avoid rate limits during dev
        self._cache = {}

    def fetch_fred_metric(self, series_id: str = "T10Y2Y") -> Optional[DataPoint]:
        """Fetch macroeconomic data from FRED (Default: Yield Curve)."""
        if not self.fred_key:
            print("WARNING: No FRED_API_KEY found.")
            return None
            
        url = f"https://api.stlouisfed.org/fred/series/observations?series_id={series_id}&api_key={self.fred_key}&file_type=json&sort_order=desc&limit=1"
        
        try:
            resp = requests.get(url)
            resp.raise_for_status()
            data = resp.json()
            if "observations" in data and len(data["observations"]) > 0:
                obs = data["observations"][0]
                val = float(obs["value"])
                date_str = obs["date"]
                return DataPoint(
                    value=val,
                    source=DataSource.FRED,
                    timestamp=datetime.strptime(date_str, "%Y-%m-%d"),
                    freshness_hours=(datetime.now() - datetime.strptime(date_str, "%Y-%m-%d")).days * 24,
                    authority_level="MARKET",
                    citation_url=f"https://fred.stlouisfed.org/series/{series_id}"
                )
        except Exception as e:
            print(f"FRED Error: {e}")
        return None

    def fetch_market_volatility(self, ticker: str = "SPY") -> Optional[DataPoint]:
        """Fetch implied volatility or similar market context from Alpha Vantage."""
        # AV doesn't give VIX directly in free tier easily, using Global Quote change as proxy for context
        if not self.av_key:
            print("WARNING: No ALPHA_VANTAGE_API_KEY found.")
            return None
            
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={self.av_key}"
        
        try:
            resp = requests.get(url)
            resp.raise_for_status()
            data = resp.json()
            quote = data.get("Global Quote", {})
            if quote:
                change_percent = float(quote.get("10. change percent", "0").replace("%", ""))
                last_trade = quote.get("07. latest trading day", datetime.now().strftime("%Y-%m-%d"))
                
                return DataPoint(
                    value=change_percent,
                    source=DataSource.ALPHA_VANTAGE,
                    timestamp=datetime.strptime(last_trade, "%Y-%m-%d"),
                    freshness_hours=0, # Assumed realtime-ish
                    authority_level="MARKET",
                    citation_url=f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}"
                )
        except Exception as e:
            print(f"AlphaVantage Error: {e}")
        return None

    def check_sec_filing(self, ticker: str) -> Optional[DataPoint]:
        """Check for recent 10-K/10-Q filings."""
        # Using SEC's public submission history JSON
        # Note: Ticker to CIK mapping is needed usually, but we'll try a direct lookup or use a reliable CIK for demo (e.g., Apple)
        # This is strictly a "Shadow Mode" check for existence/latency.
        
        # For robustness, we need a CIK. Using Apple (320193) as proxy check for API connectivity mostly.
        # In production, we'd look up the CIK for the specific portfolio company.
        # Let's assume we are checking Apple for now to verify the pipe.
        cik = "0000320193" 
        
        url = f"https://data.sec.gov/submissions/CIK{cik}.json"
        headers = {"User-Agent": self.sec_user_agent}
        
        try:
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            recent = data["filings"]["recent"]
            
            # Find last 10-K or 10-Q
            for i, form in enumerate(recent["form"]):
                if form in ["10-K", "10-Q"]:
                    filing_date = recent["filingDate"][i]
                    accession = recent["accessionNumber"][i]
                    
                    return DataPoint(
                        value=1.0, # Binary "Found"
                        source=DataSource.SEC_XBRL,
                        timestamp=datetime.strptime(filing_date, "%Y-%m-%d"),
                        freshness_hours=(datetime.now() - datetime.strptime(filing_date, "%Y-%m-%d")).days * 24,
                        authority_level="REGULATORY",
                        citation_url=f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession}.txt"
                    )
                    break
        except Exception as e:
            print(f"SEC Error: {e}")
        return None
