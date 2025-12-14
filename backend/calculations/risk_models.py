from pydantic import BaseModel
from typing import List, Optional, Dict

class StressScenario(BaseModel):
    name: str
    description: str
    shocks: Dict[str, float]
    # Shocks mapping:
    # "revenue_growth": -0.05 (5% decrease)
    # "ebitda_margin": -0.02 (2% decrease)
    # "discount_rate": +0.02 (2% increase)
    # "terminal_multiple": -0.20 (20% decrease)
    # "public_comp_multiple": -0.30 (30% decrease)

class StressTestResult(BaseModel):
    scenario_name: str
    company_name: str
    valuation_id: str
    base_value: float
    stressed_value: float
    change_percent: float
    impact_description: str

class PortfolioStressTestResponse(BaseModel):
    scenario: str
    total_base_value: float
    total_stressed_value: float
    total_change_percent: float
    company_results: List[StressTestResult]

class CompanyHealthResult(BaseModel):
    company_name: str
    runway_months: Optional[float]
    data_quality_score: float # 0-100
    red_flags: List[str]

class PortfolioHealthResponse(BaseModel):
    avg_runway_months: float
    avg_data_quality: float
    total_companies: int
    healthy_companies: int
    at_risk_companies: int
    company_results: List[CompanyHealthResult]
