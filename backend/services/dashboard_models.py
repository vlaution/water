from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class TopOpportunity(BaseModel):
    company_name: str
    valuation: float
    date: str
    id: str

class ExecutiveViewResponse(BaseModel):
    total_portfolio_value: float
    active_companies: int
    average_confidence: float
    top_opportunities: List[TopOpportunity]
    recent_activity: List[Dict[str, Any]]

class FinanceViewResponse(BaseModel):
    benchmarking_data: List[Dict[str, Any]]

class StrategyViewResponse(BaseModel):
    growth_data: List[Dict[str, Any]]

class InvestorViewResponse(BaseModel):
    readiness_data: List[Dict[str, Any]]
    key_risks: List[str]

class PortfolioSummary(BaseModel):
    total_ev: float
    avg_multiple: float
    weighted_avg_multiple: float = 0.0
    active_companies: int
    data_quality_score: float = 0.0
    last_updated: Optional[str] = None
    
    # Comparison fields (vs historical)
    total_ev_change: Optional[float] = None
    avg_multiple_change: Optional[float] = None
    active_companies_change: Optional[int] = None

class ValuationHeatmapItem(BaseModel):
    run_id: str
    company_name: str
    enterprise_value: float
    confidence_score: float
    sector: Optional[str] = "Unknown"
    region: Optional[str] = "Global"
    completeness_score: float = 0.0
    last_updated: Optional[str] = None
    validation_warnings: List[str] = []

class BenchmarkComparison(BaseModel):
    sector: str
    avg_ev_ebitda: float
    portfolio_avg_ev_ebitda: float

class AcquisitionPotentialItem(BaseModel):
    company_name: str
    score: float
    reason: str

class PortfolioAnnotation(BaseModel):
    id: str
    date: str
    label: str
    type: str = "event" # event, milestone, alert

class ValuationTimelineItem(BaseModel):
    date: str
    total_ev: float
    annotation: Optional[PortfolioAnnotation] = None

class RiskMatrixItem(BaseModel):
    company_name: str
    risk_level: str  # "High", "Medium", "Low"
    flags: List[str]

class PortfolioViewResponse(BaseModel):
    portfolio_summary: PortfolioSummary
    valuation_heatmap: List[ValuationHeatmapItem]
    benchmark_comparison: List[BenchmarkComparison]
    acquisition_potential: List[AcquisitionPotentialItem]
    valuation_timeline: List[ValuationTimelineItem]
    risk_matrix: List[RiskMatrixItem]
