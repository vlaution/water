from pydantic import BaseModel, Field
from typing import Optional

class AcquirerData(BaseModel):
    ticker: Optional[str] = None
    share_price: float = Field(..., gt=0, description="Current share price of the acquirer")
    shares_outstanding: float = Field(..., gt=0, description="Number of shares outstanding (in millions)")
    eps: float = Field(..., description="Earnings Per Share (LTM or Forward)")
    pe_ratio: Optional[float] = Field(None, description="Price to Earnings Ratio")
    tax_rate: float = Field(0.21, ge=0, le=1, description="Corporate Tax Rate")
    excess_cash: float = Field(0.0, ge=0, description="Excess cash available for the deal (in millions)")

class TargetData(BaseModel):
    ticker: Optional[str] = None
    current_share_price: Optional[float] = Field(None, gt=0, description="Current share price (if public)")
    shares_outstanding: Optional[float] = Field(None, gt=0, description="Shares outstanding (if public)")
    net_income: float = Field(..., description="Net Income (LTM or Forward, in millions)")
    pre_tax_synergies: float = Field(0.0, ge=0, description="Expected pre-tax synergies (in millions)")
    transaction_fees: float = Field(0.0, ge=0, description="Transaction fees (in millions)")

class DealStructure(BaseModel):
    offer_price: float = Field(..., gt=0, description="Offer price per share (or total valuation if private)")
    percent_cash: float = Field(0.0, ge=0, le=1, description="Percentage of deal paid in cash")
    percent_stock: float = Field(0.0, ge=0, le=1, description="Percentage of deal paid in stock")
    percent_debt: float = Field(0.0, ge=0, le=1, description="Percentage of deal paid in debt")
    interest_rate_on_debt: float = Field(0.05, ge=0, description="Interest rate on new debt")
    interest_rate_on_cash: float = Field(0.02, ge=0, description="Foregone interest rate on cash")

class MergerAnalysisRequest(BaseModel):
    acquirer_data: AcquirerData
    target_data: TargetData
    deal_structure: DealStructure

class MergerAnalysisResult(BaseModel):
    pro_forma_eps: float
    accretion_dilution_amount: float
    accretion_dilution_percent: float
    pro_forma_pe: float
    breakeven_synergies: float
    total_purchase_price: float
    new_shares_issued: float
    debt_used: float
    cash_used: float
    interest_expense_impact: float
    foregone_interest_impact: float
