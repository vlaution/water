from pydantic import BaseModel
from typing import List, Dict, Optional

class CompanyMetrics(BaseModel):
    ticker: str
    period: str = "LTM" # or "FY2023"
    
    # Profitability
    roe: Optional[float] = None
    roa: Optional[float] = None
    roic: Optional[float] = None
    net_margin: Optional[float] = None
    gross_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    ebitda_margin: Optional[float] = None
    
    # Liquidity
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    cash_ratio: Optional[float] = None
    
    # Leverage
    debt_to_equity: Optional[float] = None
    debt_to_assets: Optional[float] = None
    interest_coverage: Optional[float] = None
    net_debt_to_ebitda: Optional[float] = None
    
    # Efficiency
    asset_turnover: Optional[float] = None
    inventory_turnover: Optional[float] = None
    receivables_turnover: Optional[float] = None
    
    # Growth (CAGR 3y or YoY)
    revenue_growth: Optional[float] = None
    ebitda_growth: Optional[float] = None
    net_income_growth: Optional[float] = None

class BenchmarkComparison(BaseModel):
    metric: str
    target_value: Optional[float]
    peer_average: Optional[float]
    industry_average: Optional[float]
    percentile: Optional[float] # 0-100
    status: str # "Above", "Below", "In Line"

class BenchmarkResponse(BaseModel):
    target: CompanyMetrics
    peer_avg: CompanyMetrics
    comparisons: List[BenchmarkComparison]
    peers_used: List[str]
