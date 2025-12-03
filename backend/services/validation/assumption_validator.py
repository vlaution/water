from typing import List
from backend.calculations.models import ValuationInput, ValidationErrorDetail

class AssumptionValidator:
    @staticmethod
    def validate_wacc(wacc: float) -> List[ValidationErrorDetail]:
        errors = []
        if wacc <= 0:
            errors.append(ValidationErrorDetail(
                field="discount_rate",
                value=wacc,
                message="WACC must be a positive number.",
                severity="error"
            ))
        
        if not (0.04 <= wacc <= 0.25):
            errors.append(ValidationErrorDetail(
                field="discount_rate", 
                value=wacc,
                message="WACC appears outside typical range (4% - 25%). Please verify.",
                severity="warning"
            ))
        return errors

    @staticmethod
    def validate_growth_rate(growth_rate: float, wacc: float) -> List[ValidationErrorDetail]:
        errors = []
        if growth_rate >= wacc:
            errors.append(ValidationErrorDetail(
                field="terminal_growth_rate",
                value=growth_rate,
                message="Terminal growth rate cannot be greater than or equal to WACC (implies infinite value).",
                severity="error"
            ))
            
        if growth_rate > 0.06:
             errors.append(ValidationErrorDetail(
                field="terminal_growth_rate",
                value=growth_rate,
                message="Terminal growth rate > 6% is unusually high (typically 2-4%).",
                severity="warning"
            ))
        return errors

    @staticmethod
    def validate_margins(margin: float) -> List[ValidationErrorDetail]:
        errors = []
        if margin > 0.8:
            errors.append(ValidationErrorDetail(
                field="ebitda_margin",
                value=margin,
                message="EBITDA margin > 80% is unusually high.",
                severity="warning"
            ))
        return errors

    @classmethod
    def validate_valuation_assumptions(cls, assumptions: ValuationInput) -> List[ValidationErrorDetail]:
        """Master validation function that runs all checks."""
        errors = []
        
        if assumptions.dcf_input:
            proj = assumptions.dcf_input.projections
            errors.extend(cls.validate_wacc(proj.discount_rate))
            errors.extend(cls.validate_growth_rate(proj.terminal_growth_rate, proj.discount_rate))
            errors.extend(cls.validate_margins(proj.ebitda_margin_start))
            
            # Debt Coverage Check
            first_year_ebitda = assumptions.dcf_input.historical.ebitda[-1] * (1 + proj.revenue_growth_start)
            if first_year_ebitda > 0:
                leverage_ratio = assumptions.dcf_input.net_debt / first_year_ebitda
                if leverage_ratio > 6.0:
                    errors.append(ValidationErrorDetail(
                        field="net_debt",
                        value=leverage_ratio,
                        message=f"High Leverage (Net Debt/EBITDA = {leverage_ratio:.1f}x)",
                        severity="warning"
                    ))
            
            if proj.terminal_exit_multiple and proj.terminal_exit_multiple < 0:
                 errors.append(ValidationErrorDetail(
                    field="terminal_exit_multiple",
                    value=proj.terminal_exit_multiple,
                    message="Negative Terminal Exit Multiple",
                    severity="error"
                ))

        return errors
