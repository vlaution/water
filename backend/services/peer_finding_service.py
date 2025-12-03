from typing import List, Dict

class PeerFindingService:
    def __init__(self):
        # Hardcoded peer map for MVP reliability
        self.peer_map = {
            "IBM": ["MSFT", "ORCL", "SAP", "ACN"],
            "AAPL": ["MSFT", "GOOGL", "AMZN", "META"],
            "MSFT": ["AAPL", "GOOGL", "AMZN", "ORCL"],
            "GOOGL": ["MSFT", "META", "AMZN", "AAPL"],
            "AMZN": ["WMT", "TGT", "COST", "GOOGL"],
            "TSLA": ["F", "GM", "TM", "RIVN"],
            "JPM": ["BAC", "C", "WFC", "GS"],
            "GS": ["MS", "JPM", "BAC", "C"],
            "NVDA": ["AMD", "INTC", "QCOM", "TSM"],
            "AMD": ["NVDA", "INTC", "QCOM", "TSM"]
        }
        
        # Fallback by sector (simplified)
        self.sector_map = {
            "Technology": ["MSFT", "AAPL", "NVDA", "ORCL"],
            "Financial Services": ["JPM", "BAC", "GS", "MS"],
            "Healthcare": ["JNJ", "PFE", "UNH", "LLY"],
            "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD"],
            "Energy": ["XOM", "CVX", "SHELL", "BP"]
        }

    def find_peers(self, ticker: str, sector: str = None) -> List[str]:
        """
        Find comparable companies for a given ticker.
        """
        ticker = ticker.upper()
        
        # 1. Direct lookup
        if ticker in self.peer_map:
            return self.peer_map[ticker]
            
        # 2. Sector lookup
        if sector and sector in self.sector_map:
            return self.sector_map[sector]
            
        # 3. Default fallback
        return ["SPY", "QQQ"] # Return indices if nothing else found, or empty list
