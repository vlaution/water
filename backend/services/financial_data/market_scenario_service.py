from typing import Dict, Any, List
from backend.services.financial_data.market_data_service import market_data_service

class MarketScenarioService:
    def get_scenarios(self) -> Dict[str, Any]:
        """
        Returns market data for different scenarios:
        - Current: Live market data
        - Stress: Higher rates, lower multiples, lower growth
        - Bull: Lower rates, higher multiples
        """
        current_rates = market_data_service.fetch_interest_rates()
        
        # Base Scenarios
        scenarios = {
            "Current": {
                "description": "Live market conditions based on real-time data.",
                "rates": current_rates,
                "multiples_adjustment": 0.0, # Add to base multiple
                "growth_adjustment": 0.0 # Add to growth rate
            },
            "Stress Test": {
                "description": "Recessionary environment: +200bps rates, -2.0x multiples.",
                "rates": {
                    k: v + 0.02 for k, v in current_rates.items()
                },
                "multiples_adjustment": -2.0,
                "growth_adjustment": -0.02
            },
            "Bull Market": {
                "description": "Expansionary environment: -50bps rates, +1.5x multiples.",
                "rates": {
                    k: max(0.0, v - 0.005) for k, v in current_rates.items()
                },
                "multiples_adjustment": 1.5,
                "growth_adjustment": 0.01
            }
        }
        
        return scenarios

market_scenario_service = MarketScenarioService()
