from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.calculations.benchmarking_models import CompanyMetrics
from enum import Enum

class GlobalConfig(BaseModel):
    # General
    default_tax_rate: float = 0.25
    default_discount_rate: float = 0.10
    
    # Working Capital Defaults
    default_dso: float = 45.0
    default_dio: float = 60.0
    default_dpo: float = 30.0
    
    # Growth & Margins
    default_revenue_growth: float = 0.05
    default_ebitda_margin: float = 0.20
    default_terminal_growth: float = 0.02
    
    # LBO Defaults
    default_entry_multiple: float = 10.0
    default_leverage: float = 4.0
    default_interest_rate: float = 0.08
    
    # Simulation Parameters
    simulation_iterations: int = 1000
    sensitivity_range: float = 0.15 # +/- 15%

# ... (existing imports)







class ValidationErrorDetail(BaseModel):
    field: str
    value: Any
    message: str
    severity: str  # "error", "warning"

class ValidationErrorResponse(BaseModel):
    type: str = "validation_error"
    details: List[ValidationErrorDetail]





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
    ev_revenue_multiple: Optional[float] = None
    ev_ebitda_multiple: Optional[float] = None

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

class LBOSolverMode(str, Enum):
    ENTRY_PRICE = "entry_price" # Solve for max entry price to hit target IRR
    TARGET_IRR = "target_irr" # Solve for IRR given fixed entry price
    EXIT_MULTIPLE = "exit_multiple" # Solve for required exit multiple
    MOIC = "moic" # Solve for Multiple on Invested Capital
    OPTIMAL_REFINANCING = "optimal_refinancing" # Solve for best refinancing year

class DebtType(str, Enum):
    SENIOR = "senior"
    MEZZANINE = "mezzanine"
    EXCHANGEABLE = "exchangeable"
    PREFERRED_EQUITY = "preferred_equity"

class DebtTranche(BaseModel):
    name: str
    amount: Optional[float] = None # None means auto-calculated (e.g. from leverage multiple)
    leverage_multiple: Optional[float] = None # Debt/EBITDA. If set, overrides amount.
    interest_rate: float
    cash_interest: bool = True # If False, PIK (Payment In Kind)
    amortization_rate: float = 0.0 # % of principal paid annually
    maturity: int = 5
    mandatory_cash_sweep_priority: int = 1 # 1 = First to be paid down
    
    @property
    def is_pik(self) -> bool:
        return not self.cash_interest

class RefinancingConfig(BaseModel):
    enabled: bool = False
    refinance_year: int = 3
    new_interest_rate: float = 0.06
    refinance_amount_pct: float = 1.0 # 1.0 = 100% of existing debt
    penalty_fee_percent: float = 0.01

class CovenantType(str, Enum):
    MAX_DEBT_EBITDA = "max_debt_ebitda"
    MIN_INTEREST_COVERAGE = "min_interest_coverage"

class CovenantRule(BaseModel):
    covenant_type: CovenantType
    limit: float
    start_year: int = 1
    end_year: int = 10

class MIPTrancheInput(BaseModel):
    name: str = "Time Vested Options"
    allocation_percent: float = 0.05 # % of Total Equity
    vesting_type: str = "time" # "time", "performance"
    vesting_period_years: float = 4.0
    cliff_years: float = 1.0
    performance_target_moic: Optional[float] = None
    strike_price: float = 0.0

class MIPConfig(BaseModel):
    option_pool_percent: float = 0.10 # Legacy/Override
    strike_price_discount: float = 0.0 
    vesting_period: int = 4 # Legacy
    cliff_years: int = 1 # Legacy
    tranches: List[MIPTrancheInput] = [] # New detailed support
    
class TaxConfig(BaseModel):
    enable_nol: bool = False
    initial_nol_balance: float = 0.0
    nol_annual_limit: float = 0.80 # % of taxable income
    interest_deductibility_cap: float = 0.30 # % of EBITDA
    # Step-Up Assumptions
    step_up_percent: float = 0.0 # % of Purchase Price allocated to step-up assets
    depreciation_years: int = 15 # Amortization period for step-up basis


class LBOFinancing(BaseModel):
    tranches: List[DebtTranche]
    total_leverage_ratio: Optional[float] = None # Total Debt / Entry EBITDA
    equity_contribution_percent: Optional[float] = None # If set, solves for Debt.

class LBOAssumptions(BaseModel):
    transaction_fees_percent: float = 0.02
    synergy_benefits: float = 0.0 # Annual EBITDA impact
    
    # Waterfall Distribution
    hurdle_rate: float = 0.08
    carry_percent: float = 0.20
    catchup_active: bool = True
    
class LBOInput(BaseModel):
    """Advanced Leveraged Buyout Analysis Inputs"""
    solve_for: LBOSolverMode = LBOSolverMode.ENTRY_PRICE
    
    # Entry
    entry_revenue: float
    entry_ebitda: float
    entry_ev_ebitda_multiple: Optional[float] = None # Required if NOT solving for Entry Price
    
    # Financing
    financing: LBOFinancing
    assumptions: LBOAssumptions = LBOAssumptions()
    
    # Operations
    revenue_growth_rate: float = 0.05
    ebitda_margin: float = 0.25
    capex_percentage: float = 0.03
    nwc_percentage: float = 0.05
    tax_rate: float = 0.25
    
    # Exit
    holding_period: int = 5
    exit_ev_ebitda_multiple: Optional[float] = None # Required if NOT solving for Exit Multiple
    target_irr: Optional[float] = 0.20 # Required if solving for Entry Price
    include_sensitivity: bool = False
    
    # Advanced Features
    refinancing_config: Optional[RefinancingConfig] = None
    covenants: List[CovenantRule] = []
    mip_assumptions: Optional[MIPConfig] = None
    tax_assumptions: Optional[TaxConfig] = None



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

