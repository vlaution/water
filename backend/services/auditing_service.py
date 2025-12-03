from typing import List, Optional
from backend.calculations.models import ValuationInput, AuditIssue
from backend.config.settings import AUDIT_THRESHOLDS
from backend.services.wacc.service import WaccCalculatorService

class AuditingService:
    def __init__(self):
        self.wacc_service = WaccCalculatorService()
        self.thresholds = AUDIT_THRESHOLDS

    async def audit_valuation_input(self, input_data: ValuationInput) -> List[AuditIssue]:
        """Main method to run all audit rules."""
        issues = []
        
        # DCF Specific Checks
        if input_data.dcf_input:
            dcf = input_data.dcf_input
            issues.extend(self._check_perpetual_growth(dcf.projections.terminal_growth_rate))
            issues.extend(self._check_revenue_growth(dcf.projections.revenue_growth_start))
            
            # WACC Check requires industry context
            # We need the ticker to get industry data. It's in GPC input or we can infer/pass it.
            # ValuationInput has company_name, but not ticker at top level. 
            # Usually ticker is passed or available. 
            # Let's assume we can get it from GPC input if available, or we might need to update ValuationInput to include ticker.
            # For now, let's check if GPC input has it.
            ticker = None
            if input_data.gpc_input:
                ticker = input_data.gpc_input.target_ticker
            
            if ticker:
                # This is async because WaccCalculatorService might fetch data
                # But WaccCalculatorService methods are sync in current implementation?
                # Let's check WaccCalculatorService. It seems sync based on previous file reads.
                # But the plan said "await". Let's assume sync for now unless we see otherwise.
                # Actually, let's make it sync to match the rest of the app for now, or async if needed.
                # The routes are async.
                
                # Fetch industry WACC
                try:
                    market_data = self.wacc_service.get_market_data(ticker)
                    industry_wacc = market_data.wacc
                    issues.extend(self._check_wacc(dcf.projections.discount_rate, industry_wacc))
                except Exception as e:
                    print(f"Could not fetch industry WACC for audit: {e}")

        # LBO Specific Checks
        if input_data.lbo_input:
            lbo = input_data.lbo_input
            # Check leverage if we can calculate it or if it's an input
            # LBO has debt_percentage
            # We can check if debt % is too high?
            # Or Debt/Equity ratio.
            # Let's check debt percentage for now.
            if lbo.debt_percentage > 0.80: # > 80% debt
                 issues.append(AuditIssue(
                    field="lbo_input.debt_percentage",
                    value=lbo.debt_percentage,
                    message=f"LBO Debt Percentage ({lbo.debt_percentage:.0%}) is very high (>80%).",
                    severity="warning"
                ))

        return issues

    def _check_perpetual_growth(self, growth_rate: float) -> List[AuditIssue]:
        if growth_rate > self.thresholds["perpetual_growth_rate_max"]:
            return [AuditIssue(
                field="dcf_input.projections.terminal_growth_rate",
                value=growth_rate,
                message=f"Perpetual growth rate ({growth_rate:.1%}) exceeds realistic long-term GDP growth (Max {self.thresholds['perpetual_growth_rate_max']:.1%}).",
                severity="error"
            )]
        return []

    def _check_wacc(self, user_wacc: float, industry_wacc: float) -> List[AuditIssue]:
        threshold = industry_wacc * self.thresholds["wacc_industry_deviation_factor"]
        if user_wacc < threshold:
            return [AuditIssue(
                field="dcf_input.projections.discount_rate", 
                value=user_wacc,
                message=f"WACC ({user_wacc:.1%}) is significantly below industry average ({industry_wacc:.1%}).",
                severity="warning"
            )]
        return []

    def _check_revenue_growth(self, growth_rate: float) -> List[AuditIssue]:
        if growth_rate > self.thresholds["revenue_growth_max"]:
             return [AuditIssue(
                field="dcf_input.projections.revenue_growth_start",
                value=growth_rate,
                message=f"Revenue growth projection ({growth_rate:.1%}) is unusually high (>50%). Ensure this is justifiable.",
                severity="warning"
            )]
        return []
