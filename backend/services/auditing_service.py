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
            financing = lbo.financing
            
            # 1. Leverage Check (>6.0x strict warning)
            total_lev = financing.total_leverage_ratio
            if total_lev is None and financing.tranches:
                total_lev = sum([t.leverage_multiple or 0 for t in financing.tranches])
            
            if total_lev and total_lev > 6.0:
                 issues.append(AuditIssue(
                    field="lbo_input.financing",
                    value=total_lev,
                    message=f"Total Leverage ({total_lev:.1f}x) exceeds recommended safety limit (>6.0x). Typical maximum is 6.0x for healthy LBOs.",
                    severity="warning"
                ))

            # 2. Equity Contribution (<25% strict warning)
            equity_pct = financing.equity_contribution_percent
            # If not provided, try to calculate from implied
            if equity_pct is None and lbo.entry_ev_ebitda_multiple and total_lev:
                # Equity = EV - Debt
                # Equity% = (EV - Debt) / EV = 1 - (Debt/EV)
                # Debt/EV = Debt/EBITDA / EV/EBITDA
                debt_to_ev = total_lev / lbo.entry_ev_ebitda_multiple
                equity_pct = 1.0 - debt_to_ev

            if equity_pct is not None and equity_pct < 0.25:
                    issues.append(AuditIssue(
                    field="lbo_input.financing.equity_contribution_percent",
                    value=equity_pct,
                    message=f"Equity Contribution ({equity_pct:.0%}) is dangerously low (<25%). Lenders typically require 30-40%.",
                    severity="error"
                ))

            # 3. IRR Feasibility (High IRR requires High Growth?)
            # Valid only if we have target IRR and growth logic
            if lbo.solve_for == "entry_price" and lbo.target_irr:
                issues.extend(self._check_irr_feasibility(lbo.target_irr, lbo.revenue_growth_rate))

            # 4. Exit Multiple vs Entry/Market
            if lbo.exit_ev_ebitda_multiple:
                issues.extend(self._check_exit_multiple(lbo.exit_ev_ebitda_multiple, lbo.entry_ev_ebitda_multiple))

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

    def _check_irr_feasibility(self, target_irr: float, growth_rate: float) -> List[AuditIssue]:
        """Check if high IRR target is mismatched with low growth assumptions."""
        # Rule: If Target IRR > 25% AND Revenue Growth < 5% -> Warning
        if target_irr > 0.25 and growth_rate < 0.05:
            return [AuditIssue(
                field="lbo_input.target_irr",
                value=target_irr,
                message=f"Target IRR ({target_irr:.0%}) is aggressive for a low-growth asset ({growth_rate:.0%} growth). Ensure margin expansion or multiple arbitrage is realistic.",
                severity="warning"
            )]
        return []

    def _check_exit_multiple(self, exit_mult: float, entry_mult: Optional[float]) -> List[AuditIssue]:
        """Check for Multiple Expansion fallacy."""
        issues = []
        if entry_mult and exit_mult > entry_mult + 1.0:
             issues.append(AuditIssue(
                field="lbo_input.exit_ev_ebitda_multiple",
                value=exit_mult,
                message=f"Exit Multiple ({exit_mult}x) is significantly higher than Entry ({entry_mult}x). Relying on multiple expansion is risky.",
                severity="warning"
            ))
        return issues
