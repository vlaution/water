from backend.calculations.merger_models import MergerAnalysisRequest, MergerAnalysisResult, AcquirerData, TargetData, DealStructure
from backend.services.financial_data.provider import FinancialDataProvider

class MergerAnalysisService:
    def __init__(self, financial_data_provider: FinancialDataProvider = None):
        self.financial_data = financial_data_provider

    async def analyze_deal(self, request: MergerAnalysisRequest) -> MergerAnalysisResult:
        """
        Perform a comprehensive accretion/dilution analysis.
        """
        acquirer = request.acquirer_data
        target = request.target_data
        deal = request.deal_structure

        # 1. Calculate Deal Value
        # If target shares are provided, deal value = offer price * shares.
        # Otherwise, assume offer_price IS the total deal value (for private companies).
        if target.shares_outstanding:
            total_purchase_price = deal.offer_price * target.shares_outstanding
        else:
            total_purchase_price = deal.offer_price

        # 2. Determine Consideration Mix
        # Normalize percentages if they don't sum to 1 (optional, but good practice)
        total_pct = deal.percent_cash + deal.percent_stock + deal.percent_debt
        if total_pct == 0:
            # Default to 100% cash if nothing specified? Or raise error. Let's assume 100% cash for safety.
            pct_cash, pct_stock, pct_debt = 1.0, 0.0, 0.0
        else:
            pct_cash = deal.percent_cash / total_pct
            pct_stock = deal.percent_stock / total_pct
            pct_debt = deal.percent_debt / total_pct

        cash_consideration = total_purchase_price * pct_cash
        stock_consideration = total_purchase_price * pct_stock
        debt_consideration = total_purchase_price * pct_debt

        # 3. Calculate Financing Costs
        # Cash: Use excess cash first (cheaper), then debt? 
        # Actually, the user specifies % Cash and % Debt explicitly. 
        # So "Cash" usually means "Cash on hand". "Debt" means "New Debt".
        
        # Foregone Interest on Cash (After-Tax)
        # Assuming we use cash on hand up to the amount specified
        foregone_interest = cash_consideration * deal.interest_rate_on_cash * (1 - acquirer.tax_rate)

        # Interest Expense on New Debt (After-Tax)
        interest_expense = debt_consideration * deal.interest_rate_on_debt * (1 - acquirer.tax_rate)

        # 4. Calculate New Shares Issued
        new_shares_issued = 0.0
        if acquirer.share_price > 0:
            new_shares_issued = stock_consideration / acquirer.share_price

        # 5. Pro Forma Net Income
        # Acquirer NI + Target NI + Synergies (After-Tax) - Interest Expense - Foregone Interest
        # Note: Transaction fees are usually capitalized or expensed. If expensed, they reduce NI one-time.
        # For recurring EPS impact, we usually ignore one-time fees, but let's subtract amortized fees if needed.
        # For simplicity, we'll ignore transaction fees in the recurring EPS calculation for now, 
        # or treat them as a reduction in cash (increasing foregone interest).
        # Let's assume fees are paid in cash at close.
        
        # Adjust cash used for fees
        cash_for_fees = target.transaction_fees
        foregone_interest_on_fees = cash_for_fees * deal.interest_rate_on_cash * (1 - acquirer.tax_rate)
        
        synergies_after_tax = target.pre_tax_synergies * (1 - acquirer.tax_rate)
        
        # Acquirer Net Income (derive from EPS if not given explicitly, but we have EPS and Shares)
        acquirer_ni = acquirer.eps * acquirer.shares_outstanding
        
        pro_forma_net_income = (
            acquirer_ni + 
            target.net_income + 
            synergies_after_tax - 
            interest_expense - 
            foregone_interest -
            foregone_interest_on_fees
        )

        # 6. Pro Forma EPS
        total_pro_forma_shares = acquirer.shares_outstanding + new_shares_issued
        pro_forma_eps = pro_forma_net_income / total_pro_forma_shares

        # 7. Accretion / Dilution
        accretion_amount = pro_forma_eps - acquirer.eps
        accretion_percent = 0.0
        if acquirer.eps != 0:
            accretion_percent = accretion_amount / abs(acquirer.eps)

        # 8. Pro Forma P/E
        # Implied share price is usually assumed to be the acquirer's share price (in efficient market)
        # or a blended multiple. Standard is Acquirer Price / Pro Forma EPS.
        pro_forma_pe = 0.0
        if pro_forma_eps > 0:
            pro_forma_pe = acquirer.share_price / pro_forma_eps

        # 9. Breakeven Synergies
        # Calculate synergies needed to make accretion = 0
        # 0 = (PF_NI / PF_Shares) - Acquirer_EPS
        # PF_NI = Acquirer_EPS * PF_Shares
        # (Acq_NI + Target_NI + Synergies_AT - Costs) = Acquirer_EPS * PF_Shares
        # Synergies_AT = (Acquirer_EPS * PF_Shares) - Acq_NI - Target_NI + Costs
        # Synergies_PreTax = Synergies_AT / (1 - Tax_Rate)
        
        target_pf_ni = acquirer.eps * total_pro_forma_shares
        required_synergies_at = target_pf_ni - (acquirer_ni + target.net_income - interest_expense - foregone_interest - foregone_interest_on_fees)
        breakeven_synergies = required_synergies_at / (1 - acquirer.tax_rate)

        return MergerAnalysisResult(
            pro_forma_eps=round(pro_forma_eps, 4),
            accretion_dilution_amount=round(accretion_amount, 4),
            accretion_dilution_percent=round(accretion_percent, 4),
            pro_forma_pe=round(pro_forma_pe, 2),
            breakeven_synergies=round(breakeven_synergies, 2),
            total_purchase_price=round(total_purchase_price, 2),
            new_shares_issued=round(new_shares_issued, 2),
            debt_used=round(debt_consideration, 2),
            cash_used=round(cash_consideration + cash_for_fees, 2),
            interest_expense_impact=round(interest_expense, 2),
            foregone_interest_impact=round(foregone_interest + foregone_interest_on_fees, 2)
        )
