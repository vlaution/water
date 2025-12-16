from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class ExternalDataProvider(ABC):
    """
    Abstract base class for external financial data providers (e.g., PitchBook, Capital IQ, Alpha Vantage).
    """
    
    @abstractmethod
    def get_company_profile(self, ticker: str) -> Dict[str, Any]:
        """Fetch basic company profile."""
        pass

    @abstractmethod
    def get_financials(self, ticker: str) -> Dict[str, Any]:
        """Fetch historical financial statements."""
        pass
    
    @abstractmethod
    def get_market_data(self, ticker: str) -> Dict[str, Any]:
        """Fetch current market data (price, volume, etc.)."""
        pass

    @abstractmethod
    def get_transaction_comps(self, sector: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent M&A transactions for a sector."""
        pass
