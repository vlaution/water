from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.calculations.benchmarking_models import CompanyMetrics
from enum import Enum

# ... (existing imports)

class MethodWeights(BaseModel):
    dcf: float = 0.4
    fcfe: float = 0.0
    gpc: float = 0.3
    precedent: float = 0.3
    anav: float = 0.0
    lbo: float = 0.0

class ReturnType(str, Enum):
    MULTIPLE = "multiple"
    IRR = "irr"

class VCMethodInput(BaseModel):
    investment_amount: float = Field(gt=0)
    target_return_type: ReturnType
    target_return: float = Field(gt=0)
    exit_year: int = Field(gt=0, le=10)
    exit_metric: str = Field("revenue")
    projected_exit_metric: float = Field(ge=0)
    exit_multiple: float = Field(gt=0)
    current_shares: float = Field(gt=0)

class AuditIssue(BaseModel):
    field: str
    value: Any
    message: str
    severity: str # "error", "warning", "info"

class ValidationErrorDetail(BaseModel):
    field: str
    value: Any
    message: str
    severity: str  # "error", "warning"

class ValidationErrorResponse(BaseModel):
    type: str = "validation_error"
    details: List[ValidationErrorDetail]

class VCMethodResult(BaseModel):
    pre_money_valuation: float
    post_money_valuation: float
    ownership_required: float
    new_shares_issued: float
    implied_share_price: float
    exit_value: float
    audit_issues: List[AuditIssue] = []

class ValuationInput(BaseModel):
    company_name: str
    currency: str = "USD"
    dcf_input: Optional[DCFInput] = None
    gpc_input: Optional[GPCInput] = None
    dcfe_input: Optional[DCFEInput] = None
    precedent_transactions_input: Optional[PrecedentTransactionsInput] = None
    lbo_input: Optional[LBOInput] = None
    anav_input: Optional[ANAVInput] = None
    scenarios: Optional[List[ScenarioInput]] = None
    sensitivity_analysis: Optional[SensitivityInput] = None
    method_weights: Optional[MethodWeights] = None
    vc_method_input: Optional[VCMethodInput] = None
    reporting_date: str = "2023-12-31"
    year: int
    value: float

class HistoricalFinancials(BaseModel):
    years: List[int]
    revenue: List[float]
    ebitda: List[float]
    ebit: List[float]
    net_income: List[float]
    capex: List[float]
    nwc: List[float]
    
    # Balance Sheet & Cash Flow Items for Benchmarking
    total_assets: Optional[List[float]] = None
    total_equity: Optional[List[float]] = None
    total_debt: Optional[List[float]] = None
    current_assets: Optional[List[float]] = None
    current_liabilities: Optional[List[float]] = None
    cash_and_equivalents: Optional[List[float]] = None
    inventory: Optional[List[float]] = None
    receivables: Optional[List[float]] = None
    
    # Calculated Metrics
    metrics: Optional[CompanyMetrics] = None
    
    # Company Profile
    company_name: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    employees: Optional[int] = None
    fiscal_year_end: Optional[str] = None

class WorkingCapitalAssumptions(BaseModel):
    dso: float = 45.0  # Days Sales Outstanding
    dio: float = 60.0  # Days Inventory Outstanding
    dpo: float = 30.0  # Days Payable Outstanding

class ProjectionAssumptions(BaseModel):
    revenue_growth_start: float
    revenue_growth_end: float
    ebitda_margin_start: float
    ebitda_margin_end: float
    tax_rate: float
    discount_rate: float
    terminal_growth_rate: float
    terminal_exit_multiple: Optional[float] = None
    depreciation_rate: float = 0.03  # Depreciation as % of Revenue
    capex_percent_revenue: Optional[float] = None # CapEx as % of Revenue
    working_capital: Optional[WorkingCapitalAssumptions] = None

class DCFInput(BaseModel):
    historical: HistoricalFinancials
    projections: ProjectionAssumptions
    shares_outstanding: float
    net_debt: float

class GPCInput(BaseModel):
    target_ticker: str
    peer_tickers: List[str]
    metrics: Dict[str, float] # e.g. {"LTM Revenue": 100, "LTM EBITDA": 20}

class DebtSchedule(BaseModel):
    """Debt schedule for FCFE calculation"""
    beginning_debt: float
    new_borrowing: float = 0.0
    debt_repayment: float = 0.0
    interest_rate: float = 0.05
    
    @property
    def ending_debt(self) -> float:
        return self.beginning_debt + self.new_borrowing - self.debt_repayment
    
    @property
    def interest_expense(self) -> float:
        return self.beginning_debt * self.interest_rate
    
    @property
    def net_borrowing(self) -> float:
        """Net change in debt (new borrowing - repayment)"""
        return self.new_borrowing - self.debt_repayment

class DCFEInput(BaseModel):
    """DCF using Free Cash Flow to Equity (FCFE)"""
    historical: HistoricalFinancials
    projections: ProjectionAssumptions
    debt_schedule: List[DebtSchedule]  # One per projection year
    cost_of_equity: float = 0.12  # Required return for equity investors
    terminal_growth_rate: float = 0.025
    shares_outstanding: float = 10000000

class PrecedentTransaction(BaseModel):
    """Single M&A transaction data point"""
    target_name: str
    acquirer_name: str
    announcement_date: str  # YYYY-MM-DD
    deal_value: float  # Enterprise value in millions
    revenue: float  # LTM revenue in millions
    ebitda: float  # LTM EBITDA in millions
    
    @property
    def ev_revenue_multiple(self) -> float:
        return self.deal_value / self.revenue if self.revenue > 0 else 0
    
    @property
    def ev_ebitda_multiple(self) -> float:
        return self.deal_value / self.ebitda if self.ebitda > 0 else 0

class PrecedentTransactionsInput(BaseModel):
    """Precedent Transactions Analysis inputs"""
    transactions: List[PrecedentTransaction]
    target_revenue: float  # Target company LTM revenue
    target_ebitda: float  # Target company LTM EBITDA
    use_median: bool = True  # Use median vs mean for multiples

class LBOInput(BaseModel):
    """Leveraged Buyout Analysis inputs"""
    # Entry assumptions
    entry_revenue: float  # LTM revenue at entry
    entry_ebitda: float  # LTM EBITDA at entry
    entry_ev_ebitda_multiple: float = 10.0  # Entry valuation multiple
    
    # Financing structure
    debt_percentage: float = 0.60  # % of purchase price financed with debt
    debt_interest_rate: float = 0.06  # Annual interest rate on debt
    
    # Operating assumptions
    revenue_growth_rate: float = 0.05  # Annual revenue growth
    ebitda_margin: float = 0.25  # EBITDA as % of revenue
    capex_percentage: float = 0.03  # CapEx as % of revenue
    nwc_percentage: float = 0.05  # NWC as % of revenue
    
    # Exit assumptions
    holding_period: int = 5  # Years until exit
    exit_ev_ebitda_multiple: float = 10.0  # Exit valuation multiple
    
    # Target returns
    target_irr: float = 0.20  # Target IRR (20%)

class ANAVInput(BaseModel):
    """Adjusted Net Asset Value inputs"""
    assets: Dict[str, float]  # Book value of assets
    liabilities: Dict[str, float]  # Book value of liabilities
    adjustments: Dict[str, float] = {}  # Fair value adjustments (e.g. {"Inventory": -10, "Property": 50})

class ScenarioInput(BaseModel):
    """Input for Scenario Analysis"""
    scenario_name: str
    projections: ProjectionAssumptions

class SensitivityInput(BaseModel):
    """Input for Sensitivity Analysis"""
    variable_1: str  # e.g. "discount_rate"
    range_1: List[float]
    variable_2: str  # e.g. "terminal_growth_rate"
    range_2: List[float]

class MethodWeights(BaseModel):
    dcf: float = 0.4
    fcfe: float = 0.0
    gpc: float = 0.3
    precedent: float = 0.3
    anav: float = 0.0
    lbo: float = 0.0

class ReturnType(str, Enum):
    MULTIPLE = "multiple"
    IRR = "irr"

class VCMethodInput(BaseModel):
    investment_amount: float = Field(gt=0)
    target_return_type: ReturnType
    target_return: float = Field(gt=0)
    exit_year: int = Field(gt=0, le=10)
    exit_metric: str = Field("revenue")
    projected_exit_metric: float = Field(ge=0)
    exit_multiple: float = Field(gt=0)
    current_shares: float = Field(gt=0)

class AuditIssue(BaseModel):
    field: str
    value: Any
    message: str
    severity: str # "error", "warning", "info"

class VCMethodResult(BaseModel):
    pre_money_valuation: float
    post_money_valuation: float
    ownership_required: float
    new_shares_issued: float
    implied_share_price: float
    exit_value: float
    audit_issues: List[AuditIssue] = []

class ValuationInput(BaseModel):
    company_name: str
    currency: str = "USD"
    dcf_input: Optional[DCFInput] = None
    gpc_input: Optional[GPCInput] = None
    dcfe_input: Optional[DCFEInput] = None
    precedent_transactions_input: Optional[PrecedentTransactionsInput] = None
    lbo_input: Optional[LBOInput] = None
    anav_input: Optional[ANAVInput] = None
    scenarios: Optional[List[ScenarioInput]] = None
    sensitivity_analysis: Optional[SensitivityInput] = None
    method_weights: Optional[MethodWeights] = None
    vc_method_input: Optional[VCMethodInput] = None
    reporting_date: str = "2023-12-31"

class ConfidenceScore(BaseModel):
    score: float  # 0-100
    rating: str  # "High", "Medium", "Low"
    factors: List[str]  # Reasons for the score

class StrategicAlert(BaseModel):
    id: str
    type: str  # "critical", "warning", "info"
    message: str
    severity: str  # "high", "medium", "low"

class ActionItem(BaseModel):
    id: str
    task: str
    status: str  # "urgent", "pending", "completed"
    priority: str  # "high", "medium", "low"

class ScenarioConfig(BaseModel):
    name: str
    probability: float
    assumptions: ValuationInput

class PWSARequest(BaseModel):
    scenarios: List[ScenarioConfig]

class ScenarioResult(BaseModel):
    name: str
    value: float
    probability: float

class RiskMetrics(BaseModel):
    var_95: float
    upside_potential: float
    standard_deviation: float

class PWSAResult(BaseModel):
    probability_weighted_value: float
    scenario_results: List[ScenarioResult]
    risk_metrics: RiskMetrics

class MarketAssumptions(BaseModel):
    risk_free_rate: float
    beta: float
    market_risk_premium: float = 0.055
    cost_of_debt: float
    cost_of_equity: float
    wacc: float



class ScenarioChange(BaseModel):
    field: str
    old_value: Any
    new_value: Any

class GenerateScenarioResponse(BaseModel):
    base_assumptions: Dict[str, Any]
    generated_assumptions: Dict[str, Any]
    changes: List[ScenarioChange]
    explanation: str
    scenario_name: str

