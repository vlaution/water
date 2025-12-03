from backend.calculations.models import VCMethodInput, VCMethodResult, AuditIssue, ReturnType

class VCMethodCalculator:
    @staticmethod
    def calculate(vc_input: VCMethodInput) -> VCMethodResult:
        # Calculate Exit Value
        exit_value = vc_input.projected_exit_metric * vc_input.exit_multiple
        
        # Calculate Post-Money Valuation
        if vc_input.target_return_type == ReturnType.MULTIPLE:
            # Post-Money = Exit Value / Target Multiple
            # Avoid division by zero
            target_return = max(vc_input.target_return, 1.0)
            post_money_valuation = exit_value / target_return
        else:  # IRR
            # Post-Money = Exit Value / (1 + IRR)^Time
            # IRR is expected as a decimal (e.g., 0.40 for 40%)
            post_money_valuation = exit_value / ((1 + vc_input.target_return) ** vc_input.exit_year)
        
        # Calculate remaining outputs
        pre_money_valuation = post_money_valuation - vc_input.investment_amount
        
        # Ownership Required = Investment / Post-Money
        if post_money_valuation > 0:
            ownership_required = vc_input.investment_amount / post_money_valuation
        else:
            ownership_required = 1.0 # Edge case: if valuation is 0 or negative, investor needs 100% (or deal is impossible)

        # New Shares Issued = Current Shares * (Ownership / (1 - Ownership))
        # Formula derivation:
        # Total Shares = Current + New
        # Ownership = New / Total
        # New = Ownership * (Current + New)
        # New * (1 - Ownership) = Ownership * Current
        # New = Current * (Ownership / (1 - Ownership))
        
        if ownership_required >= 1.0:
            new_shares_issued = 0 # Impossible deal
            implied_share_price = 0
        else:
            new_shares_issued = vc_input.current_shares * (ownership_required / (1 - ownership_required))
            implied_share_price = vc_input.investment_amount / new_shares_issued if new_shares_issued > 0 else 0

        # Perform VC-specific sanity checks
        audit_issues = VCMethodCalculator._audit_vc_assumptions(vc_input, ownership_required, pre_money_valuation)
        
        return VCMethodResult(
            pre_money_valuation=pre_money_valuation,
            post_money_valuation=post_money_valuation,
            ownership_required=ownership_required,
            new_shares_issued=new_shares_issued,
            implied_share_price=implied_share_price,
            exit_value=exit_value,
            audit_issues=audit_issues
        )

    @staticmethod
    def _audit_vc_assumptions(vc_input: VCMethodInput, ownership: float, pre_money: float) -> list[AuditIssue]:
        """VC-specific sanity checks."""
        issues = []
        
        # 1. Ownership Dilution Warning
        if ownership > 0.4:
            issues.append(AuditIssue(
                field="investment_amount",
                value=vc_input.investment_amount,
                message=f"Investment requires {ownership:.1%} ownership. This is highly dilutive (>40%) and may be rejected by founders.",
                severity="warning"
            ))
            
        # 2. Pre-Money Valuation Check
        if pre_money < 0:
            issues.append(AuditIssue(
                field="pre_money_valuation",
                value=pre_money,
                message="Calculated Pre-Money Valuation is negative. The investment ask is too high relative to the exit potential.",
                severity="error"
            ))
            
        # 3. Exit Multiple Check
        if vc_input.exit_multiple > 20:
             issues.append(AuditIssue(
                field="exit_multiple",
                value=vc_input.exit_multiple,
                message=f"Exit multiple of {vc_input.exit_multiple}x is very aggressive. Typical SaaS exits are 5-10x Revenue.",
                severity="warning"
            ))
            
        # 4. Target Return Check
        if vc_input.target_return_type == ReturnType.IRR and vc_input.target_return < 0.20:
             issues.append(AuditIssue(
                field="target_return",
                value=vc_input.target_return,
                message="Target IRR < 20% is typically too low for early-stage VC risk.",
                severity="info"
            ))
            
        return issues
