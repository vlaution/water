from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class DistributionType(str, Enum):
    NORMAL = "normal"
    TRIANGULAR = "triangular"
    UNIFORM = "uniform"

class SimulationVariable(BaseModel):
    name: str  # e.g., "revenue_growth", "ebitda_margin", "wacc"
    distribution: DistributionType
    params: Dict[str, float]  # e.g., {"mean": 0.05, "std_dev": 0.01} or {"min": 0.1, "max": 0.2, "mode": 0.15}

class MonteCarloRequest(BaseModel):
    base_enterprise_value: float
    base_revenue: float # LTM Revenue
    base_ebitda: float # LTM EBITDA
    iterations: int = 1000
    variables: List[SimulationVariable]
    
    # Simplified DCF assumptions for the simulation engine
    projection_years: int = 5
    tax_rate: float = 0.25
    terminal_growth_rate: float = 0.025

class SimulationStatistic(BaseModel):
    mean: float
    median: float
    std_dev: float
    min: float
    max: float
    p10: float
    p90: float

class HistogramBucket(BaseModel):
    range_start: float
    range_end: float
    frequency: int

class MonteCarloResult(BaseModel):
    statistics: SimulationStatistic
    histogram: List[HistogramBucket]
    iterations_run: int
