import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import ValuationRun
from backend.calculations.risk_models import StressScenario, StressTestResult, PortfolioStressTestResponse

class StressTestService:
    def __init__(self, db: Session):
        self.db = db

    def get_scenarios(self) -> List[StressScenario]:
        """
        Define standard VC stress scenarios.
        """
        return [
            StressScenario(
                name="Funding Winter",
                description="Higher discount rates, lower terminal multiples, and harder fundraising environment.",
                shocks={
                    "discount_rate": 0.05,        # +5% WACC
                    "terminal_multiple": -0.20,   # -20% Exit Multiple
                    "revenue_growth": -0.10       # -10% Growth due to capital constraints
                }
            ),
            StressScenario(
                name="Market Correction",
                description="Public market multiples compress significantly.",
                shocks={
                    "public_comp_multiple": -0.30, # -30% Public Comps
                    "discount_rate": 0.02          # +2% Risk Premium
                }
            ),
            StressScenario(
                name="Inflation Surge",
                description="Higher costs and higher discount rates.",
                shocks={
                    "ebitda_margin": -0.05,       # -5% Margin (higher costs)
                    "discount_rate": 0.03         # +3% WACC
                }
            )
        ]

    def run_stress_test(self, scenario_name: str) -> PortfolioStressTestResponse:
        """
        Apply a specific scenario to all valuations in the portfolio.
        """
        scenarios = {s.name: s for s in self.get_scenarios()}
        if scenario_name not in scenarios:
            raise ValueError(f"Unknown scenario: {scenario_name}")
            
        scenario = scenarios[scenario_name]
        valuations = self.db.query(ValuationRun).all()
        
        results = []
        total_base = 0.0
        total_stressed = 0.0
        
        for v in valuations:
            try:
                # 1. Parse existing inputs and results
                inputs = json.loads(v.input_data)
                original_results = json.loads(v.results)
                
                # Get base value (Enterprise Value)
                # Assuming simple structure for MVP
                base_value = original_results.get("enterprise_value", 0.0)
                if base_value == 0:
                     # Fallback to equity value or dcf result if EV is missing
                     base_value = original_results.get("dcf_valuation", {}).get("enterprise_value", 0.0)

                # 2. Apply Shocks to Inputs
                # This is a simplified simulation. In a real system, we'd re-run the full ValuationEngine.
                # For MVP, we'll approximate the impact based on sensitivities or direct adjustments.
                
                # However, to be "good enough", let's try to adjust the key drivers directly if possible,
                # or apply a percentage haircut based on the shocks.
                
                # Let's use a "Sensitivity Factor" approach for MVP speed:
                # - 1% change in WACC -> ~10-15% change in value (Duration)
                # - 1% change in Growth -> ~5-10% change in value
                # - 1% change in Margin -> ~1% change in value (linear)
                
                # Better approach: Re-calculate using a simplified DCF model here?
                # No, that duplicates logic.
                # Best approach for MVP: Apply "Impact Factors" derived from typical VC valuation models.
                
                impact = 0.0
                
                # WACC Impact (Duration proxy ~15)
                if "discount_rate" in scenario.shocks:
                    # +1% WACC -> -15% Value
                    impact += (scenario.shocks["discount_rate"] * 100) * -0.15
                    
                # Growth Impact
                if "revenue_growth" in scenario.shocks:
                    # -1% Growth -> -5% Value
                    impact += (scenario.shocks["revenue_growth"] * 100) * 0.05
                    
                # Margin Impact
                if "ebitda_margin" in scenario.shocks:
                    # -1% Margin -> -1% Value (roughly)
                    impact += (scenario.shocks["ebitda_margin"] * 100) * 0.01
                    
                # Multiple Impact
                if "terminal_multiple" in scenario.shocks:
                    # Direct % impact on Terminal Value (which is ~70% of EV)
                    impact += scenario.shocks["terminal_multiple"] * 0.7
                    
                if "public_comp_multiple" in scenario.shocks:
                    # Direct % impact on Market Approach (if used). Assuming 50/50 weight.
                    impact += scenario.shocks["public_comp_multiple"] * 0.5

                # Calculate Stressed Value
                stressed_value = base_value * (1 + impact)
                if stressed_value < 0: stressed_value = 0
                
                change_pct = (stressed_value - base_value) / base_value if base_value else 0.0
                
                results.append(StressTestResult(
                    scenario_name=scenario.name,
                    company_name=v.company_name,
                    valuation_id=v.id,
                    base_value=base_value,
                    stressed_value=stressed_value,
                    change_percent=change_pct,
                    impact_description=f"Applied shocks: {json.dumps(scenario.shocks)}"
                ))
                
                total_base += base_value
                total_stressed += stressed_value
                
            except Exception as e:
                print(f"Error stressing valuation {v.id}: {e}")
                continue
                
        total_change_pct = (total_stressed - total_base) / total_base if total_base else 0.0
        
        return PortfolioStressTestResponse(
            scenario=scenario.name,
            total_base_value=total_base,
            total_stressed_value=total_stressed,
            total_change_percent=total_change_pct,
            company_results=results
        )
