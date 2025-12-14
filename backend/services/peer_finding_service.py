import json
import os
from typing import List, Dict, Optional

class PeerFindingService:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "market_data.json")
        self.companies = self._load_data()
        self.ticker_map = {c["ticker"]: c for c in self.companies}

    def _load_data(self) -> List[Dict]:
        try:
            with open(self.data_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Market data not found at {self.data_path}")
            return []

    def find_peers(self, ticker: str, sector: str = None, limit: int = 5) -> List[str]:
        """
        Find comparable companies for a given ticker.
        Algorithm:
        1. Identify target sector/industry.
        2. Filter companies in same industry (preferred) or sector.
        3. Sort by Market Cap proximity.
        4. Return top N tickers.
        """
        ticker = ticker.upper()
        target = self.ticker_map.get(ticker)
        
        if not target:
            # Fallback if target not in DB
            if sector:
                # Find companies in this sector
                candidates = [c for c in self.companies if c["sector"] == sector]
                return [c["ticker"] for c in candidates[:limit]]
            return ["SPY", "QQQ"] # Ultimate fallback

        target_sector = target["sector"]
        target_industry = target["industry"]
        target_mcap = target["market_cap"]

        # 1. Filter by Industry (Tier 1 peers)
        industry_peers = [c for c in self.companies if c["industry"] == target_industry and c["ticker"] != ticker]
        industry_peers.sort(key=lambda c: abs(c["market_cap"] - target_mcap))
        
        # 2. Filter by Sector (Tier 2 peers) - if not enough industry peers
        sector_peers = [c for c in self.companies if c["sector"] == target_sector and c["industry"] != target_industry and c["ticker"] != ticker]
        sector_peers.sort(key=lambda c: abs(c["market_cap"] - target_mcap))

        # Combine: prioritize industry peers
        candidates = industry_peers + sector_peers

        # 4. Return top N
        return [c["ticker"] for c in candidates[:limit]]

    def get_company_metrics(self, ticker: str) -> Optional[Dict]:
        """Helper to get metrics for a ticker if available"""
        return self.ticker_map.get(ticker.upper())

