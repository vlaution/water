from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ExecutiveViewResponse(BaseModel):
    total_portfolio_value: float
    active_companies: int
    average_confidence: float
    enterprise_value: float = 0.0
    strategic_alerts: List[Dict[str, Any]] = []
    top_opportunities: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class FinanceViewResponse(BaseModel):
    company_name: str
    enterprise_value: float
    equity_value: float
    wacc: float
    multiples: Dict[str, float]
    benchmarks: Dict[str, Any]

class StrategyViewResponse(BaseModel):
    company_name: str
    scenarios: List[Dict[str, Any]]
    sensitivity_analysis: Dict[str, Any]
    strategic_alerts: List[Dict[str, Any]]

class InvestorViewResponse(BaseModel):
    company_name: str
    deal_readiness_score: float
    key_risks: List[str]
    upside_potential: float
    exit_scenarios: List[Dict[str, Any]]

class DashboardConfig(BaseModel):
    layout: Dict[str, Any]  # e.g., {"visible_components": ["ev_card", "alerts"], "order": [...]}
    theme: Optional[str] = "light"

class OverviewViewResponse(BaseModel):
    company_name: str
    valuation_summary: Dict[str, Any]  # EV, Equity Value, Method Weights
    credibility_score: Dict[str, Any] # Score, Rating
    scenarios: Dict[str, float] # Base, Bull, Bear values
    forecast: Dict[str, List[float]] # Revenue, EBITDA, FCF (Historical + Projected)
    terminal_value_split: Dict[str, float] # TV vs PV of FCF
    risks: List[str] # List of critical alerts
    method_breakdown: Dict[str, float] # Values for each method
    input_summary: Dict[str, Any] # Full input summary

