from pydantic import BaseModel
from typing import List, Dict, Any

class RefinancingAnalysisRequest(BaseModel):
    current_debt_amount: float
    current_interest_rate: float
    new_interest_rate: float
    remaining_term_years: int
    refinancing_cost_percent: float = 0.01 # 1% fee
    tax_rate: float = 0.25
    discount_rate: float = 0.10

class RefinancingResult(BaseModel):
    annual_interest_savings: float
    total_interest_savings: float
    upfront_cost: float
    net_present_value: float
    break_even_years: float
    recommendation: str

class RefinancingService:
    def analyze_refinancing(self, request: RefinancingAnalysisRequest) -> RefinancingResult:
        """
        Analyzes the financial impact of refinancing debt.
        """
        # 1. Calculate Annual Interest Savings (Pre-tax)
        current_annual_interest = request.current_debt_amount * request.current_interest_rate
        new_annual_interest = request.current_debt_amount * request.new_interest_rate
        annual_savings_pre_tax = current_annual_interest - new_annual_interest
        
        # 2. Tax Effect
        # Interest is tax deductible, so saving interest increases tax bill.
        # Net Savings = Savings * (1 - Tax Rate)
        annual_savings_after_tax = annual_savings_pre_tax * (1 - request.tax_rate)
        
        # 3. Upfront Costs
        upfront_cost = request.current_debt_amount * request.refinancing_cost_percent
        
        # 4. NPV Calculation
        # NPV = Sum(Savings / (1+r)^t) - Upfront Cost
        npv = -upfront_cost
        for t in range(1, request.remaining_term_years + 1):
            npv += annual_savings_after_tax / ((1 + request.discount_rate) ** t)
            
        # 5. Break-even Analysis
        # Simple Payback Period = Cost / Annual Savings
        if annual_savings_after_tax > 0:
            break_even_years = upfront_cost / annual_savings_after_tax
        else:
            break_even_years = 999.0 # Never breaks even
            
        # 6. Recommendation
        if npv > 0 and break_even_years < 3:
            recommendation = "Strongly Recommend"
        elif npv > 0:
            recommendation = "Recommend"
        else:
            recommendation = "Do Not Refinance"
            
        return RefinancingResult(
            annual_interest_savings=round(annual_savings_after_tax, 2),
            total_interest_savings=round(annual_savings_after_tax * request.remaining_term_years, 2),
            upfront_cost=round(upfront_cost, 2),
            net_present_value=round(npv, 2),
            break_even_years=round(break_even_years, 1),
            recommendation=recommendation
        )

refinancing_service = RefinancingService()
