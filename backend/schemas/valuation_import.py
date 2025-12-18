from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

class FinancialYear(BaseModel):
    year: int
    revenue: float
    gross_profit: float
    ebitda: float
    net_income: float

class BalanceSheetSnapshot(BaseModel):
    cash: float
    short_term_investments: float
    debt: float

class WorkingCapitalYear(BaseModel):
    year: Union[int, str, datetime] # Can be date or int year
    trade_receivables: float
    inventory: float
    trade_payables: float
    working_capital: float
    change_in_working_capital: float

class CapexYear(BaseModel):
    year: Union[int, str, datetime]
    fixed_assets: float
    depreciation: float
    net_capital_expenditure: float

class ValuationResult(BaseModel):
    method: str
    approach: str
    enterprise_value: float
    weight: float

class WACCMetrics(BaseModel):
    risk_free_rate: float
    beta: float
    equity_risk_premium: float
    cost_of_equity: float
    cost_of_debt_post_tax: float
    wacc: float

class ValuationImportData(BaseModel):
    company_name: str = Field(..., description="Name of the company from the Excel file")
    valuation_date: str = Field(..., description="Valuation date string")
    currency: str = Field(..., description="Currency code (e.g. USD)")
    tax_rate: float = Field(..., description="Tax rate as a decimal (e.g. 0.25)")
    geography: Dict[str, bool] = Field(..., description="Geography selection map")
    
    financials: List[FinancialYear] = Field(default_factory=list, description="Historical and projected financials")
    balance_sheet: Optional[BalanceSheetSnapshot] = None
    working_capital: List[WorkingCapitalYear] = Field(default_factory=list)
    capex: List[CapexYear] = Field(default_factory=list)
    
    valuation_results: List[ValuationResult] = Field(default_factory=list)
    wacc_metrics: Optional[WACCMetrics] = None
    
    # Optional metadata if we expand later
    meta: Optional[Dict[str, Any]] = None

class ImportResponse(BaseModel):
    status: str
    data: Optional[ValuationImportData] = None
    message: Optional[str] = None
    error: Optional[str] = None
