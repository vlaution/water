from backend.services.financial_data.provider import FinancialDataProvider
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider

class FinancialDataFactory:
    @staticmethod
    def get_provider(provider_type: str = "alpha_vantage") -> FinancialDataProvider:
        if provider_type == "alpha_vantage":
            return AlphaVantageProvider()
        else:
            raise ValueError(f"Unknown provider type: {provider_type}")
