from abc import ABC, abstractmethod
from typing import Optional, Any
from backend.calculations.models import HistoricalFinancials, MarketAssumptions

class FinancialDataProvider(ABC):
    """
    Abstract base class for financial data providers.
    """

    @abstractmethod
    def get_financials(self, ticker: str, user: Any = None) -> HistoricalFinancials:
        """
        Fetch historical financial data for a given ticker.
        """
        pass

    @abstractmethod
    def get_market_assumptions(self, ticker: str) -> MarketAssumptions:
        """
        Fetch market assumptions (Risk-Free Rate, Beta, etc.) for a given ticker.
        """
        pass
    
    @abstractmethod
    def get_company_beta(self, ticker: str) -> float:
        """
        Fetch the beta for a given ticker.
        """
        pass
        
    @abstractmethod
    def get_treasury_yield(self) -> float:
        """
        Fetch the current 10-year Treasury Yield.
        """
        pass
