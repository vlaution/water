from pydantic import BaseModel
from typing import List, Optional, Dict

class FundModel(BaseModel):
    name: str
    vintage_year: int
    committed_capital: float  # Total fund size
    management_fee: float = 0.02  # 2%
    carried_interest: float = 0.20  # 20%
    hurdle_rate: float = 0.08  # 8%
    fund_term_years: int = 10
    investment_period_years: int = 5

class FundStrategy(BaseModel):
    target_deal_count: int = 10
    min_deal_size: float
    max_deal_size: float
    target_sectors: List[str]
    target_irr_mean: float = 0.20
    target_irr_std_dev: float = 0.05
    hold_period_mean: float = 5.0
    hold_period_std_dev: float = 1.0

class CashFlow(BaseModel):
    year: int
    amount: float  # Negative for capital calls, positive for distributions
    type: str  # "Capital Call", "Distribution", "Management Fee"

class FundReturns(BaseModel):
    net_irr: float
    tvpi: float  # Total Value to Paid-In
    dpi: float   # Distributions to Paid-In
    moic: float  # Multiple on Invested Capital
    cash_flows: List[CashFlow]
    gross_returns: float
    total_invested: float
    total_distributed: float
    total_value: float
