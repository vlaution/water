from backend.calculations.models import LBOInput, LBOSolverMode, DebtType, CovenantType
from typing import Tuple, Dict, Any, List


class EnhancedLBOCalculator:
    @staticmethod
    def calculate(lbo_input: LBOInput) -> Tuple[float, Dict[str, Any]]:
        if not lbo_input:
            return 0.0, {}
            
        mode = lbo_input.solve_for
        
        if mode == LBOSolverMode.ENTRY_PRICE:
            # If Refinancing Optimization is requested via side-channel or config, we'd handle it here
            # But usually Optimal Refi is a specific analysis type.
            # However, if the user manually triggers "Optimal Refi", we can handle it.
            # For now, let's keep entry price solvings as is.
            return EnhancedLBOCalculator._solve_for_entry_price(lbo_input)
        elif mode == LBOSolverMode.TARGET_IRR:
            # Solving for IRR given fixed price is just running the model once
            # But the user might mean "Calculate the IRR" which is the default output
            return EnhancedLBOCalculator._calculate_single_run(lbo_input, lbo_input.entry_ev_ebitda_multiple)
        elif mode == LBOSolverMode.EXIT_MULTIPLE:
             return EnhancedLBOCalculator._solve_for_exit_multiple(lbo_input)
        elif mode == LBOSolverMode.OPTIMAL_REFINANCING or mode.value == "optimal_refinancing":
            return EnhancedLBOCalculator._solve_optimal_refinancing(lbo_input)
        else:
            # Default to entry price or single run
            if lbo_input.entry_ev_ebitda_multiple:
                return EnhancedLBOCalculator._calculate_single_run(lbo_input, lbo_input.entry_ev_ebitda_multiple)
            return EnhancedLBOCalculator._solve_for_entry_price(lbo_input)

    @staticmethod
    def _solve_for_entry_price(lbo_input: LBOInput) -> Tuple[float, Dict[str, Any]]:
        target_irr = lbo_input.target_irr or 0.20
        
        # Secant Method for faster convergence (O(log log n)) vs Binary Search (O(log n))
        # f(x) = Calculated_IRR(x) - Target_IRR = 0
        
        # Initial Guesses
        x0 = 8.0
        x1 = 12.0
        
        # Run 0
        irr0, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, x0)
        f0 = irr0 - target_irr
        
        # Run 1
        irr1, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, x1)
        f1 = irr1 - target_irr
        
        final_mult = x1
        
        # Iteration
        for _ in range(10): # usually converges in 4-5 steps
            if abs(f1) < 0.0001:
                final_mult = x1
                break
                
            denominator = f1 - f0
            if abs(denominator) < 1e-9:
                break # Avoid zero division, stick with best guess
                
            x2 = x1 - f1 * (x1 - x0) / denominator
            
            # Constrain to reasonable bounds
            x2 = max(1.0, min(x2, 50.0))
            
            # Shift
            x0, f0 = x1, f1
            x1 = x2
            
            # Calc new
            irr2, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, x1)
            f1 = irr2 - target_irr
            final_mult = x1
            
        return EnhancedLBOCalculator._calculate_single_run(lbo_input, final_mult)

    @staticmethod
    def _solve_optimal_refinancing(lbo_input: LBOInput) -> Tuple[float, Dict[str, Any]]:
        """
        Iterates through all possible refinancing years to find the one that maximizes IRR.
        Returns the result of the optimal run.
        """
        best_irr = -999.0
        best_year = 0
        
        # We assume refi config exists, otherwise no point
        if not lbo_input.refinancing_config:
            # Default to no refi or standard run
            return EnhancedLBOCalculator._calculate_single_run(lbo_input, lbo_input.entry_ev_ebitda_multiple or 10.0)
            
        # Case 1: No Refinancing
        lbo_input.refinancing_config.enabled = False
        irr_no_refi, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, lbo_input.entry_ev_ebitda_multiple or 10.0)
        
        best_irr = irr_no_refi
        best_year = 0 # 0 means disabled
        
        # Case 2: Refinance Years 1 to N-1
        lbo_input.refinancing_config.enabled = True
        
        for year in range(1, lbo_input.holding_period):
            lbo_input.refinancing_config.refinance_year = year
            try:
                irr, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, lbo_input.entry_ev_ebitda_multiple or 10.0)
                if irr > best_irr:
                    best_irr = irr
                    best_year = year
            except:
                continue
                
        # Run Final with Best Year
        if best_year == 0:
            lbo_input.refinancing_config.enabled = False
        else:
            lbo_input.refinancing_config.enabled = True
            lbo_input.refinancing_config.refinance_year = best_year
            
        # We need to inject the note into the final results
        implied_ev, results = EnhancedLBOCalculator._calculate_single_run(lbo_input, lbo_input.entry_ev_ebitda_multiple or 10.0)
        results["optimization_note"] = f"Optimal Refinancing Year: {best_year if best_year > 0 else 'None'} (Yields IRR: {round(best_irr * 100, 2)}%)"
        
        return implied_ev, results

    @staticmethod
    def _solve_for_exit_multiple(lbo_input: LBOInput) -> Tuple[float, Dict[str, Any]]:
        target_irr = lbo_input.target_irr or 0.20
        entry_mult = lbo_input.entry_ev_ebitda_multiple or 10.0
        
        # Secant Method solving for Exit Multiple
        x0 = entry_mult
        x1 = entry_mult + 2.0
        
        original_exit = lbo_input.exit_ev_ebitda_multiple
        
        try:
            # Run 0
            lbo_input.exit_ev_ebitda_multiple = x0
            irr0, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, entry_mult)
            f0 = irr0 - target_irr
            
            # Run 1
            lbo_input.exit_ev_ebitda_multiple = x1
            irr1, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, entry_mult)
            f1 = irr1 - target_irr
            
            final_mult = x1
            
            for _ in range(10):
                if abs(f1) < 0.0001:
                    final_mult = x1
                    break
                    
                denominator = f1 - f0
                if abs(denominator) < 1e-9:
                    break
                    
                x2 = x1 - f1 * (x1 - x0) / denominator
                x2 = max(1.0, min(x2, 100.0))
                
                x0, f0 = x1, f1
                x1 = x2
                
                lbo_input.exit_ev_ebitda_multiple = x1
                irr2, _, _ = EnhancedLBOCalculator._run_waterfall(lbo_input, entry_mult)
                f1 = irr2 - target_irr
                final_mult = x1
                
        finally:
            lbo_input.exit_ev_ebitda_multiple = original_exit # Restore just in case, though below we overwrite
            
        lbo_input.exit_ev_ebitda_multiple = final_mult
        return EnhancedLBOCalculator._calculate_single_run(lbo_input, entry_mult)

    @staticmethod
    def _calculate_single_run(lbo_input: LBOInput, entry_multiple: float) -> Tuple[float, Dict[str, Any]]:
        irr, moic, details = EnhancedLBOCalculator._run_waterfall(lbo_input, entry_multiple)
        implied_ev = lbo_input.entry_ebitda * entry_multiple * 1000000 if lbo_input.entry_ebitda else 0
        
        results = {
            "implied_entry_multiple": round(entry_multiple, 2),
            "implied_entry_ev": implied_ev,
            "irr": round(irr, 4),
            "moic": round(moic, 2),
            "holding_period": lbo_input.holding_period,
            "schedule": details['schedule'],
            "waterfall": details['waterfall_summary'],
            "sources": details.get('sources', {}),
            "uses": details.get('uses', {}),
            "returns_analysis": details.get('returns_analysis', {}),
            "sensitivity_matrix": details.get('sensitivity_matrix')
        }
        return implied_ev, results

    @staticmethod
    def _run_waterfall(lbo_input: LBOInput, entry_multiple: float) -> Tuple[float, float, Dict[str, Any]]:
        # 1. Setup Deal Structure
        entry_ev = lbo_input.entry_ebitda * entry_multiple
        
        # Calculate Debt Amount
        tranches = [t.copy() for t in lbo_input.financing.tranches]
        total_debt = 0.0
        
        # Initialize Tranches
        for t in tranches:
            if t.leverage_multiple:
                t.amount = lbo_input.entry_ebitda * t.leverage_multiple
            elif t.amount is None:
                t.amount = 0.0 # Should not happen if validated
            total_debt += t.amount
            
        equity_check = entry_ev - total_debt + (entry_ev * lbo_input.assumptions.transaction_fees_percent)
        
        # 2. Run Projection Loop
        current_revenue = lbo_input.entry_revenue
        schedule = []
        
        # Track current balances
        balances = {t.name: t.amount for t in tranches}
        
        # New State for Advanced Features
        current_nol = lbo_input.tax_assumptions.initial_nol_balance if lbo_input.tax_assumptions and lbo_input.tax_assumptions.enable_nol else 0.0
        
        for year in range(1, lbo_input.holding_period + 1):
            # --- 1. REFINANCING LOGIC ---
            refi_config = lbo_input.refinancing_config
            refi_occurred = False
            refi_fees = 0.0
            
            if refi_config and refi_config.enabled and year == refi_config.refinance_year:
                # Calculate total debt to refinance
                total_current_debt = sum(balances.values())
                refi_amount_target = total_current_debt * refi_config.refinance_amount_pct
                
                # Apply penalty fees
                refi_fees = total_current_debt * refi_config.penalty_fee_percent
                
                # Simple Logic: Replace all senior debt with new debt tranche
                # In reality, you'd match tranches, but here we'll consolidate into a "Refinanced Debt" tranche
                # Reset balances
                balances = {"Refinanced Term Loan": refi_amount_target}
                
                # Update Tranche List for interest calc (this year and future)
                # Remove old tranches, add new one
                tranches = [
                    t for t in tranches if False # Remove all (or selectively)
                ]
                from backend.calculations.models import DebtTranche # Late import to avoid circular if any
                refi_tranche = DebtTranche(
                    name="Refinanced Term Loan",
                    amount=refi_amount_target,
                    interest_rate=refi_config.new_interest_rate,
                    cash_interest=True,
                    amortization_rate=0.01, # Default 1% amort
                    maturity=7,
                    mandatory_cash_sweep_priority=1
                )
                tranches.append(refi_tranche)
                refi_occurred = True

            # Operations
            yr_revenue = current_revenue * (1 + lbo_input.revenue_growth_rate)
            yr_ebitda = yr_revenue * lbo_input.ebitda_margin + lbo_input.assumptions.synergy_benefits
            
            # Cash Flow Items
            capex = yr_revenue * lbo_input.capex_percentage
            delta_nwc = (yr_revenue - current_revenue) * lbo_input.nwc_percentage
            tax_rate = lbo_input.tax_rate
            
            # Interest Calculation
            total_cash_interest = 0.0
            total_pik_interest = 0.0
            
            year_trache_data = []

            for t in tranches:
                beg_bal = balances[t.name]
                interest = beg_bal * t.interest_rate
                
                if t.cash_interest:
                    total_cash_interest += interest
                    this_pik = 0.0
                else:
                    this_pik = interest
                    total_pik_interest += interest
                    
                year_trache_data.append({
                    "name": t.name,
                    "beginning_balance": beg_bal,
                    "interest": interest,
                    "is_pik": not t.cash_interest
                })
                
                # PIK Accrual
                balances[t.name] += this_pik

            # --- 2. ADVANCED TAX LOGIC ---
            # Tax Calculation (Tax Deductibility of Interest + NOLs)
            
            ebit = yr_ebitda - (yr_revenue * 0.03) # Dummy D&A
            
            # Interest Deductibility Cap (e.g. 30% of EBITDA)
            deductible_interest = total_cash_interest
            if lbo_input.tax_assumptions and lbo_input.tax_assumptions.interest_deductibility_cap > 0:
                interest_cap = yr_ebitda * lbo_input.tax_assumptions.interest_deductibility_cap
                deductible_interest = min(total_cash_interest, interest_cap)
            
            pre_tax_income = ebit - deductible_interest
            
            # --- STEP-UP DEPRECIATION ---
            step_up_deduction = 0.0
            if lbo_input.tax_assumptions and lbo_input.tax_assumptions.step_up_percent > 0:
                step_up_basis = entry_ev * lbo_input.tax_assumptions.step_up_percent
                years = lbo_input.tax_assumptions.depreciation_years or 15
                step_up_deduction = step_up_basis / years
                
            taxable_income = pre_tax_income - step_up_deduction
            
            # Apply NOLs
            if lbo_input.tax_assumptions and lbo_input.tax_assumptions.enable_nol and current_nol > 0:
                # Limit usage to % of taxable income
                max_usage = max(0, taxable_income * lbo_input.tax_assumptions.nol_annual_limit)
                actual_usage = min(current_nol, max_usage, max(0, taxable_income))
                
                taxable_income -= actual_usage
                current_nol -= actual_usage
            elif pre_tax_income < 0 and lbo_input.tax_assumptions and lbo_input.tax_assumptions.enable_nol:
                # Create NEW NOLs
                current_nol += abs(pre_tax_income)
                taxable_income = 0
                
            taxes = max(0, taxable_income * tax_rate)
            
            # FCF for Debt Service
            # EBITDA - Taxes - CapEx - NWC Change - Cash Interest
            # Note: Taxes are cash taxes. If we used step-up, taxable income was lower, so taxes are lower.
            # We don't need to add back step_up explicitly because we started from EBITDA (which is pre-depreciation)
            # and subtracted TAXES (which were reduced by step-up).
            fcf_available_for_debt = yr_ebitda - taxes - capex - delta_nwc - total_cash_interest - refi_fees

            
            # Mandatory Amortization & Cash Sweep
            remaining_fcf = max(0, fcf_available_for_debt)
            total_paydown = 0.0
            
            # 1. Mandatory Amortization
            for t in tranches:
                if t.amortization_rate > 0:
                    amort_payment = t.amount * t.amortization_rate # % of original principal
                    amort_payment = min(amort_payment, balances[t.name])
                    balances[t.name] -= amort_payment
                    remaining_fcf -= amort_payment
                    total_paydown += amort_payment
                    
            # 2. Cash Sweep (Sorted by priority)
            available_sweep = max(0, remaining_fcf) # Assume 100% sweep for now
            sorted_tranches = sorted(tranches, key=lambda x: x.mandatory_cash_sweep_priority)
            
            for t in sorted_tranches:
                if t.is_pik: continue # Don't prepay PIK usually, simplified
                
                sweep_payment = min(available_sweep, balances[t.name])
                balances[t.name] -= sweep_payment
                available_sweep -= sweep_payment
                total_paydown += sweep_payment
            
            # --- 3. COVENANT COMPLIANCE ---
            covenant_status = "ok"
            breached_covenants = []
            
            total_debt_end = sum(balances.values())
            
            for cov in lbo_input.covenants:
                if year >= cov.start_year and year <= cov.end_year:
                    if cov.covenant_type == CovenantType.MAX_DEBT_EBITDA:
                        ratio = total_debt_end / yr_ebitda if yr_ebitda > 0 else 999.0
                        if ratio > cov.limit:
                            breached_covenants.append(f"Debt/EBITDA > {cov.limit}x ({round(ratio,1)}x)")
                    elif cov.covenant_type == CovenantType.MIN_INTEREST_COVERAGE:
                        total_int = total_cash_interest + total_pik_interest
                        ratio = yr_ebitda / total_int if total_int > 0 else 999.0
                        if ratio < cov.limit:
                            breached_covenants.append(f"Int. Cov < {cov.limit}x ({round(ratio,1)}x)")
            
            if breached_covenants:
                covenant_status = "breached"

            # Record Year
            schedule.append({
                "year": year,
                "revenue": round(yr_revenue, 2),
                "ebitda": round(yr_ebitda, 2),
                "fcf_debt": round(fcf_available_for_debt, 2),
                "interest_expense": round(total_cash_interest + total_pik_interest, 2),
                "total_debt_balance": round(total_debt_end, 2),
                "tranches": year_trache_data,
                "refinancing_fee": refi_fees,
                "covenant_status": covenant_status,
                "breaches": breached_covenants
            })

            
            current_revenue = yr_revenue

        # 3. Exit Returns
        final_ebitda = schedule[-1]["ebitda"]
        exit_ev = final_ebitda * (lbo_input.exit_ev_ebitda_multiple or entry_multiple)
        final_net_debt = sum(balances.values())
        exit_equity = exit_ev - final_net_debt
        
        # Metrics
        moic = exit_equity / equity_check if equity_check > 0 else 0
        if equity_check <= 0: irr = 10.0
        elif exit_equity <= 0: irr = -1.0
        else:
            irr = (exit_equity / equity_check) ** (1 / lbo_input.holding_period) - 1
            
        # 4. Sources & Uses
        sources = {
            "Total Equity": equity_check,
            "Total Debt": total_debt
        }
        for t in tranches:
            if t.amount > 0:
                sources[f"{t.name}"] = t.amount
        
        uses = {
            "Purchase Price": entry_ev,
            "Transaction Fees": entry_ev * lbo_input.assumptions.transaction_fees_percent,
            "Refinancing": 0.0 # Placeholder
        }
        
        # 5. Returns Analysis
        # Simple Waterfall Distribution
        profit = exit_equity - equity_check
        hurdle_rate = lbo_input.assumptions.hurdle_rate
        carry_pct = lbo_input.assumptions.carry_percent
        
        # --- MULTI-TIER WATERFALL ---
        # 1. Return of Capital
        dist_capital = min(exit_equity, equity_check)
        remaining_proceeds = max(0, exit_equity - dist_capital)
        
        # 2. Preferred Return (Hurdle)
        pref_amount = equity_check * ((1 + hurdle_rate) ** lbo_input.holding_period - 1)
        dist_pref = min(remaining_proceeds, pref_amount)
        remaining_proceeds -= dist_pref
        
        # 3. GP Catch-up
        # 20% of Total Profits (Pref + Catchup + Carry)
        # Catchup Logic: GP gets Catchup until GP / (GP + LP_Pref) = Carry%
        # Formula: Catchup = Pref * (Carry / (1-Carry))
        gp_catchup = 0.0
        if lbo_input.assumptions.catchup_active and remaining_proceeds > 0:
            catchup_required = dist_pref * (carry_pct / (1 - carry_pct))
            dist_catchup = min(remaining_proceeds, catchup_required)
            gp_catchup = dist_catchup
            remaining_proceeds -= dist_catchup
            
        # 4. Carried Interest
        dist_carry = remaining_proceeds * carry_pct
        dist_lp_remainder = remaining_proceeds * (1 - carry_pct)
        
        gp_carry = gp_catchup + dist_carry
        # LP gets: Capital + Pref + Remainder
        # (calculated implicitly as Total - GP)
            
            
        # --- 4. MIP (MANAGEMENT INCENTIVE PLAN) ---
        mip_value = 0.0
        mip_details = []
        
        if lbo_input.mip_assumptions:
            assumptions = lbo_input.mip_assumptions
            
            # Check for new Tranche-based logic
            if assumptions.tranches:
                total_mip_value = 0.0
                for tranche in assumptions.tranches:
                    # 1. Vesting Calculation
                    vested_percent = 0.0
                    
                    if tranche.vesting_type == "time":
                        # Simple linear vesting
                        if lbo_input.holding_period < tranche.cliff_years:
                            vested_percent = 0.0
                        else:
                            vested_percent = min(1.0, lbo_input.holding_period / tranche.vesting_period_years)
                            
                    elif tranche.vesting_type == "performance":
                        # MOIC Target
                        current_moic = (exit_equity / equity_check) if equity_check > 0 else 0
                        if tranche.performance_target_moic and current_moic >= tranche.performance_target_moic:
                            vested_percent = 1.0
                        else:
                            vested_percent = 0.0
                    
                    # 2. Value Calculation
                    # Value = (Exit Equity * Allocation %) * Vested %
                    # Note: This is a simplified "Profit Share" model. 
                    # For true Options: (Exit Equity / Total Shares * Options) - (Strike * Options)
                    # We'll stick to the Profit Share / Pool % model for LBO simplicity unless strike is used.
                    
                    tranche_value = 0.0
                    gross_value = exit_equity * tranche.allocation_percent * vested_percent
                    
                    # Apply Strike Price deduction if applicable (simplified as a value deduction)
                    # Assuming allocation_percent represents % of fully diluted equity
                    if tranche.strike_price > 0:
                        # This is tricky without share counts. 
                        # Proxy: Strike Price reduces the net value.
                        # Net Value = Gross Value - (Strike Price * implied_share_count)
                        # Let's assume Strike Price is "Total Strike Value for this Tranche" for simplicity in this MVP
                        # Or better: Strike Price is per share. We need share count.
                        # Fallback: Ignore strike for MVP unless we have share count.
                        pass
                        
                    tranche_value = gross_value
                    total_mip_value += tranche_value
                    
                    mip_details.append({
                        "name": tranche.name,
                        "vested_percent": round(vested_percent * 100, 1),
                        "value": round(tranche_value, 2)
                    })
                
                mip_value = total_mip_value
                
            else:
                # Legacy Fallback
                pool_pct = assumptions.option_pool_percent
                mip_value = exit_equity * pool_pct
                mip_details.append({"name": "Legacy Pool", "value": mip_value})
            
            # Reduce LP profit by MIP share
            profit -= mip_value 
            dist_capital -= mip_value # Attribution to exit equity
            lp_profit = profit - gp_carry
        else:
            lp_profit = profit - gp_carry

        lp_moic = (equity_check + lp_profit) / equity_check if equity_check > 0 else 0
        
        returns_analysis = {
            "moic": round(moic, 2),
            "irr": round(irr, 4),
            "entry_equity": equity_check,
            "exit_equity": exit_equity,
            "invested_capital": equity_check,
            "profit": profit,
            # Distribution
            "gp_carry": round(gp_carry, 2),
            "lp_profit": round(lp_profit, 2),
            "lp_moic": round(lp_moic, 2),
            "hurdle_rate": hurdle_rate,
             # Detailed Waterfall
            "dist_capital": round(dist_capital, 2),
            "dist_pref": round(dist_pref, 2),
            "gp_catchup": round(gp_catchup, 2),
            "dist_carry": round(dist_carry, 2),
            # MIP Details
            "mip_value": round(mip_value, 2),
            "mip_tranches": mip_details,
            "mip_pool_percent": lbo_input.mip_assumptions.option_pool_percent if lbo_input.mip_assumptions else 0.0
        }


        # 6. Sensitivity Analysis
        sensitivity_matrix = None
        if lbo_input.include_sensitivity:
            sensitivity_matrix = EnhancedLBOCalculator._calculate_sensitivity(lbo_input, entry_multiple)

        waterfall_summary = {
            "entry_equity": equity_check,
            "exit_equity": exit_equity,
            "total_debt_paydown": total_debt - final_net_debt,
            "final_debt": final_net_debt
        }
            
        return irr, moic, {
            "schedule": schedule, 
            "waterfall_summary": waterfall_summary,
            "sources": sources,
            "uses": uses,
            "returns_analysis": returns_analysis,
            "sensitivity_matrix": sensitivity_matrix
        }

    @staticmethod
    def _calculate_sensitivity(lbo_input: LBOInput, base_entry_multiple: float) -> Dict[str, Any]:
        """
        Generates a 3x3 Sensitivity Matrix for IRR (Entry Multiple vs Exit Multiple)
        OPTIMIZED: Runs waterfall once per Entry Multiple (O(N)), then calculates Exit Multiples instantly.
        """
        # Ranges
        entry_multiples = [base_entry_multiple + (i * 0.5) for i in range(-1, 2)]
        
        # Determine Exit Multiples to test
        base_exit = lbo_input.exit_ev_ebitda_multiple if lbo_input.exit_ev_ebitda_multiple else base_entry_multiple
        exit_multiples = [base_exit + (i * 0.5) for i in range(-1, 2)]
        
        # Prevent infinite recursion
        original_sensitivity_flag = lbo_input.include_sensitivity
        lbo_input.include_sensitivity = False
        
        matrix = []
        try:
            # We iterate differently now:
            # Outer Loop: Entry Multiples (Requires full waterfall calculation)
            # Inner Loop: Exit Multiples (Just math on the result)
            
            # First, pre-calculate the row results for each entry multiple
            # We store the "End State" of the waterfall for each entry multiple
            waterfall_results = {} 
            
            for entry_mult in entry_multiples:
                try:
                    # We pass the default exit multiple to the waterfall, but it doesn't fundamentally change the Schedule/Debt paydown
                    # It only changes the final "exit_equity" number.
                    # We need the "Entry Equity" and "Final Net Debt" and "Final EBITDA" from the run.
                    
                    # Run generic waterfall
                    _, _, details = EnhancedLBOCalculator._run_waterfall(lbo_input, entry_mult)
                    
                    # Extract reusable components
                    waterfall_results[entry_mult] = {
                        "equity_check": details['sources']['Total Equity'],
                        "final_ebitda": details['schedule'][-1]['ebitda'],
                        "final_net_debt": details['waterfall_summary']['final_debt']
                    }
                except:
                    waterfall_results[entry_mult] = None

            # Now build the matrix in the requested format (Rows = Exit Multiples, Cols = Entry Multiples)
            # Or usually: Rows = different Exit Multiples, Cols = different Entry Multiples
            
            for exit_mult in exit_multiples:
                row_irrs = []
                for entry_mult in entry_multiples:
                    res = waterfall_results.get(entry_mult)
                    if res:
                        # Re-calculate IRR instantly without running waterfall
                        equity_check = res['equity_check']
                        final_ebitda = res['final_ebitda']
                        final_net_debt = res['final_net_debt']
                        
                        exit_ev = final_ebitda * exit_mult
                        exit_equity = exit_ev - final_net_debt
                        
                        if equity_check <= 0: irr = 10.0 # Edge case
                        elif exit_equity <= 0: irr = -1.0 # Loss
                        else:
                            irr = (exit_equity / equity_check) ** (1 / lbo_input.holding_period) - 1
                            
                        row_irrs.append(round(irr, 4))
                    else:
                        row_irrs.append(0.0)
                
                matrix.append({
                    "exit_multiple": round(exit_mult, 1),
                    "irrs": row_irrs
                })
                
        finally:
            lbo_input.include_sensitivity = original_sensitivity_flag
            
        return {
            "entry_multiples": [round(m, 1) for m in entry_multiples],
            "rows": matrix
        }


# Alias for backwards compatibility if needed
LBOCalculator = EnhancedLBOCalculator
