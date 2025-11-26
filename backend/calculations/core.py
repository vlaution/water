from backend.calculations.transformer import DataTransformer
from typing import Dict, Any, Optional, List
from backend.calculations.models import ConfidenceScore, StrategicAlert, ActionItem, SensitivityInput
from backend.parser.models import WorkbookData

class ValuationEngine:
    def __init__(self, workbook_data: Optional[WorkbookData] = None, mappings: Optional[Dict[str, str]] = None):
        self.workbook_data = workbook_data
        self.mappings = mappings
        self.results = {}

    def run(self) -> Dict[str, Any]:
        if not self.workbook_data or not self.mappings:
            raise ValueError("Workbook data and mappings are required for run()")
            
        # Transform raw data into structured input
        transformer = DataTransformer(self.workbook_data, self.mappings)
        valuation_input = transformer.transform()
        
        return self.calculate(valuation_input)

    def calculate(self, valuation_input) -> Dict[str, Any]:
        # Perform calculations
        dcf_value, dcf_flows, dcf_details = self._calculate_dcf(valuation_input.dcf_input)
        gpc_value = self._calculate_gpc(valuation_input.gpc_input)
        fcfe_value = self._calculate_fcfe(valuation_input.dcfe_input)
        pt_value = self._calculate_precedent_transactions(valuation_input.precedent_transactions_input)
        lbo_value = self._calculate_lbo(valuation_input.lbo_input)
        anav_value = self._calculate_anav(valuation_input.anav_input)
        
        # Validation
        warnings = self.validate_inputs(valuation_input)
        
        # Determine which methods were used and apply weights
        methods_used = {}
        total_weight = 0
        
        # Default weights if not provided
        weights = valuation_input.method_weights
        if not weights:
            # Fallback to simple logic if no weights provided
            if dcf_value > 0: methods_used["DCF_FCFF"] = {"value": dcf_value, "weight": 0.4}
            if gpc_value > 0: methods_used["GPC"] = {"value": gpc_value, "weight": 0.3}
            if pt_value > 0: methods_used["Precedent_Transactions"] = {"value": pt_value, "weight": 0.3}
            if fcfe_value > 0 and "DCF_FCFF" not in methods_used: methods_used["DCF_FCFE"] = {"value": fcfe_value, "weight": 0.4}
            if lbo_value > 0: methods_used["LBO"] = {"value": lbo_value, "weight": 0.0}
            if anav_value > 0: methods_used["ANAV"] = {"value": anav_value, "weight": 0.0}
        else:
            # Use provided weights
            if dcf_value > 0: methods_used["DCF_FCFF"] = {"value": dcf_value, "weight": weights.dcf}
            if fcfe_value > 0: methods_used["DCF_FCFE"] = {"value": fcfe_value, "weight": weights.fcfe}
            if gpc_value > 0: methods_used["GPC"] = {"value": gpc_value, "weight": weights.gpc}
            if pt_value > 0: methods_used["Precedent_Transactions"] = {"value": pt_value, "weight": weights.precedent}
            if lbo_value > 0: methods_used["LBO"] = {"value": lbo_value, "weight": weights.lbo}
            if anav_value > 0: methods_used["ANAV"] = {"value": anav_value, "weight": weights.anav}

        # Normalize weights
        total_weight = sum(m["weight"] for m in methods_used.values())
        if total_weight > 0:
            enterprise_value = sum(m["value"] * m["weight"] for m in methods_used.values()) / total_weight
        else:
            enterprise_value = 0
        
        # Equity value calculation
        net_debt = valuation_input.dcf_input.net_debt if valuation_input.dcf_input else 0
        equity_value = enterprise_value - net_debt
        
        # Scenario Analysis
        scenario_results = []
        if valuation_input.scenarios:
            for scenario in valuation_input.scenarios:
                if valuation_input.dcf_input:
                    scenario_dcf_input = valuation_input.dcf_input.copy()
                    scenario_dcf_input.projections = scenario.projections
                    scenario_val, _, scenario_details = self._calculate_dcf(scenario_dcf_input)
                    scenario_equity = scenario_val - net_debt
                    scenario_results.append({
                        "name": scenario.scenario_name,
                        "enterprise_value": scenario_val,
                        "equity_value": scenario_equity,
                        "dcf_details": scenario_details
                    })

        # Sensitivity Analysis
        sensitivity_matrix = {}
        if valuation_input.dcf_input:
            # Use provided sensitivity input or default
            sens_input = valuation_input.sensitivity_analysis
            if not sens_input:
                # Default: WACC vs Terminal Growth
                base_wacc = valuation_input.dcf_input.projections.discount_rate
                base_growth = valuation_input.dcf_input.projections.terminal_growth_rate
                sens_input = SensitivityInput(
                    variable_1="discount_rate",
                    range_1=[base_wacc - 0.01, base_wacc, base_wacc + 0.01],
                    variable_2="terminal_growth_rate",
                    range_2=[base_growth - 0.005, base_growth, base_growth + 0.005]
                )
            
            sensitivity_matrix = self.generate_sensitivity_matrix(sens_input, valuation_input.dcf_input)

        self.results = {
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "wacc": valuation_input.dcf_input.projections.discount_rate if valuation_input.dcf_input else 0,
            "methods": methods_used,
            "scenarios": scenario_results,
            "sensitivity": sensitivity_matrix,
            "warnings": warnings,
            "dcf_details": dcf_details if dcf_value > 0 else {},
            "input_summary": valuation_input.dict(),
            "confidence_score": self._calculate_confidence_score(valuation_input, methods_used),
            "strategic_alerts": self._generate_strategic_alerts(valuation_input, enterprise_value),
            "action_items": self._generate_action_items(valuation_input, enterprise_value)
        }
        return self.results

    def _calculate_gpc(self, gpc_input) -> float:
        if not gpc_input:
            return 0.0
            
        # Mock multiples
        multiples = {
            "PEER1": {"EV/Rev": 2.0, "EV/EBITDA": 10.0},
            "PEER2": {"EV/Rev": 2.5, "EV/EBITDA": 12.0},
            "PEER3": {"EV/Rev": 1.8, "EV/EBITDA": 9.0}
        }
        
        # Calculate median multiples
        ev_rev_median = sorted([m["EV/Rev"] for m in multiples.values()])[1]
        ev_ebitda_median = sorted([m["EV/EBITDA"] for m in multiples.values()])[1]
        
        # Apply to target
        val_revenue = gpc_input.metrics["LTM Revenue"] * ev_rev_median
        val_ebitda = gpc_input.metrics["LTM EBITDA"] * ev_ebitda_median
        
        # Average of the two methods
        return ((val_revenue + val_ebitda) / 2) * 1000000

    def _calculate_anav(self, anav_input) -> float:
        """
        Calculate Adjusted Net Asset Value
        """
        if not anav_input:
            return 0.0
            
        total_assets = sum(anav_input.assets.values())
        total_liabilities = sum(anav_input.liabilities.values())
        
        # Apply adjustments
        asset_adjustments = sum(v for k, v in anav_input.adjustments.items() if k in anav_input.assets)
        liability_adjustments = sum(v for k, v in anav_input.adjustments.items() if k in anav_input.liabilities)
        
        adjusted_assets = total_assets + asset_adjustments
        adjusted_liabilities = total_liabilities + liability_adjustments
        
        return max(0, adjusted_assets - adjusted_liabilities)

    def _calculate_dcf(self, dcf_input) -> float:
        if not dcf_input:
            return 0.0
            
        proj = dcf_input.projections
        hist = dcf_input.historical
        
        # Simple projection for 5 years
        last_revenue = hist.revenue[-1]
        projected_cash_flows = []
        
        current_revenue = last_revenue
        
        # Initialize previous WC for change calculation
        # Estimate initial WC based on last year's revenue and assumptions
        if proj.working_capital:
            prev_ar = (last_revenue / 365) * proj.working_capital.dso
            # Proxy COGS as Revenue * 0.6 for inventory/payables if not available
            proxy_cogs = last_revenue * 0.6 
            prev_inv = (proxy_cogs / 365) * proj.working_capital.dio
            prev_ap = (proxy_cogs / 365) * proj.working_capital.dpo
            prev_nwc = prev_ar + prev_inv - prev_ap
        else:
            prev_nwc = 0 # Should use historical NWC if available, but for now 0 change base
            
        for year in range(5):
            # 1. Revenue
            # Linear interpolation of growth rate
            growth_rate = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (year / 4)
            current_revenue *= (1 + growth_rate)
            
            # 2. EBITDA
            # Linear interpolation of margin
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (year / 4)
            ebitda = current_revenue * margin
            
            # 3. Depreciation & EBIT
            depreciation = current_revenue * proj.depreciation_rate
            ebit = ebitda - depreciation
            
            # 4. Tax & NOPAT
            tax = max(0, ebit * proj.tax_rate)
            nopat = ebit - tax
            
            # 5. Working Capital
            if proj.working_capital:
                ar = (current_revenue / 365) * proj.working_capital.dso
                proxy_cogs = current_revenue * 0.6
                inv = (proxy_cogs / 365) * proj.working_capital.dio
                ap = (proxy_cogs / 365) * proj.working_capital.dpo
                nwc = ar + inv - ap
                change_in_nwc = nwc - prev_nwc
                prev_nwc = nwc
            else:
                # Fallback to simple % of revenue change if no detailed WC
                # Assuming NWC is 5% of revenue if not specified
                nwc = current_revenue * 0.05
                change_in_nwc = nwc - (current_revenue / (1+growth_rate) * 0.05)
            
            # 6. CapEx (assume equal to depreciation + growth portion, or just % of revenue)
            # Let's use depreciation as base + some growth, or just a fixed %
            # For simplicity, let's assume CapEx = Depreciation * 1.1 (maintenance + growth)
            capex = depreciation * 1.1
            
            # 7. FCFF
            fcff = nopat + depreciation - capex - change_in_nwc
            projected_cash_flows.append(fcff)
            
        # Terminal Value
        # Method 1: Gordon Growth
        terminal_cash_flow = projected_cash_flows[-1] * (1 + proj.terminal_growth_rate)
        tv_ggm = terminal_cash_flow / (proj.discount_rate - proj.terminal_growth_rate)
        
        # Method 2: Exit Multiple
        tv_multiple = 0
        if proj.terminal_exit_multiple:
            terminal_ebitda = ebitda # Last year EBITDA
            tv_multiple = terminal_ebitda * proj.terminal_exit_multiple
            
        # Select TV (use Multiple if provided, else GGM)
        terminal_value = tv_multiple if proj.terminal_exit_multiple else tv_ggm
        
        # Discounting
        dcf_value = 0
        for i, cf in enumerate(projected_cash_flows):
            dcf_value += cf / ((1 + proj.discount_rate) ** (i + 1))
            
        dcf_value += terminal_value / ((1 + proj.discount_rate) ** 5)
        
        return dcf_value, projected_cash_flows, {
            "revenue": [last_revenue * (1 + proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4)) for i in range(5)], # Simplified for return
            "ebitda": [last_revenue * (1 + proj.revenue_growth_start) * (proj.ebitda_margin_start) for i in range(5)], # Simplified
            "fcff": projected_cash_flows,
            "balance_sheet": {
                "cash": [cf * 0.1 for cf in projected_cash_flows], # Mock cash balance
                "working_capital": [cf * 0.05 for cf in projected_cash_flows], # Mock WC
                "ppe": [cf * 2.0 for cf in projected_cash_flows], # Mock PP&E
                "debt": [dcf_input.net_debt * (0.9 ** i) for i in range(5)], # Mock debt paydown
                "equity": [dcf_value * (1.05 ** i) for i in range(5)] # Mock equity growth
            }
        }

    def generate_sensitivity_matrix(self, sensitivity_input, dcf_input) -> Dict[str, Any]:
        """
        Generate 2D sensitivity matrix for DCF
        """
        if not sensitivity_input or not dcf_input:
            return {}
            
        rows = sensitivity_input.range_1
        cols = sensitivity_input.range_2
        matrix = []
        
        base_proj = dcf_input.projections
        
        for r_val in rows:
            row_data = []
            for c_val in cols:
                # Create temp projections
                # Note: This is a bit hacky, ideally use deepcopy
                temp_proj = base_proj.copy()
                
                # Update variables based on names
                # Supported vars: discount_rate, terminal_growth_rate, terminal_exit_multiple, revenue_growth_end, ebitda_margin_end
                if sensitivity_input.variable_1 == "discount_rate":
                    temp_proj.discount_rate = r_val
                elif sensitivity_input.variable_1 == "terminal_growth_rate":
                    temp_proj.terminal_growth_rate = r_val
                # ... add other mappings as needed
                
                if sensitivity_input.variable_2 == "discount_rate":
                    temp_proj.discount_rate = c_val
                elif sensitivity_input.variable_2 == "terminal_growth_rate":
                    temp_proj.terminal_growth_rate = c_val
                
                # Run DCF
                temp_dcf_input = dcf_input.copy()
                temp_dcf_input.projections = temp_proj
                val, _, _ = self._calculate_dcf(temp_dcf_input)
                row_data.append(val)
            matrix.append(row_data)
            
        return {
            "x_axis": {"name": sensitivity_input.variable_2, "values": cols},
            "y_axis": {"name": sensitivity_input.variable_1, "values": rows},
            "matrix": matrix
        }

    def validate_inputs(self, valuation_input) -> List[str]:
        """
        Validate inputs for logical consistency
        """
        warnings = []
        if valuation_input.dcf_input:
            p = valuation_input.dcf_input.projections
            
            # WACC vs Growth
            if p.terminal_growth_rate >= p.discount_rate:
                warnings.append("Critical: Terminal growth rate >= Discount rate (Infinite Value)")
            
            # WACC sanity check
            if p.discount_rate < 0.05:
                warnings.append("Warning: Discount rate < 5% seems low")
            elif p.discount_rate > 0.25:
                warnings.append("Warning: Discount rate > 25% seems high")
                
            # Margin sanity check
            if p.ebitda_margin_start > 0.8:
                warnings.append("Warning: EBITDA margin start > 80%")
            
            # Debt Coverage Check (Net Debt / EBITDA)
            # Use first year EBITDA as proxy
            first_year_ebitda = valuation_input.dcf_input.historical.ebitda[-1] * (1 + p.revenue_growth_start)
            if first_year_ebitda > 0:
                leverage_ratio = valuation_input.dcf_input.net_debt / first_year_ebitda
                if leverage_ratio > 6.0:
                    warnings.append(f"Warning: High Leverage (Net Debt/EBITDA = {leverage_ratio:.1f}x)")
            
            # Negative Terminal Value Check
            # This is implicit in the calculation, but good to warn if assumptions lead there
            if p.terminal_exit_multiple and p.terminal_exit_multiple < 0:
                 warnings.append("Critical: Negative Terminal Exit Multiple")

        return warnings
        for i in range(5):
            # Linear interpolation of growth and margin
            growth = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4)
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (i / 4)
            
            current_revenue *= (1 + growth)
            ebitda = current_revenue * margin
            # Simplified FCFF: EBITDA * (1 - Tax) - Capex - Change in NWC
            # Assuming Capex and NWC as % of revenue for simplicity or fixed growth
            # For MVP, let's assume FCFF is roughly 60% of EBITDA after all deductions
            fcff = ebitda * 0.6 
            
            projected_cash_flows.append(fcff)
            
        # Terminal Value (Gordon Growth)
        last_fcff = projected_cash_flows[-1]
        terminal_value = last_fcff * (1 + proj.terminal_growth_rate) / (proj.discount_rate - proj.terminal_growth_rate)
        
        # Discounting
        present_value = 0
        for i, cf in enumerate(projected_cash_flows):
            present_value += cf / ((1 + proj.discount_rate) ** (i + 1))
            
        present_value += terminal_value / ((1 + proj.discount_rate) ** 5)
        
        return present_value * 1000000 # Scaling back to actual units if inputs were in millions

    def _calculate_fcfe(self, dcfe_input) -> float:
        """
        Calculate Free Cash Flow to Equity (FCFE) valuation
        FCFE = Net Income + D&A - CapEx - ΔNWc + Net Borrowing
        """
        if not dcfe_input:
            return 0.0
        
        proj = dcfe_input.projections
        hist = dcfe_input.historical
        debt_schedule = dcfe_input.debt_schedule
        
        # Project 5 years of FCFE
        last_revenue = hist.revenue[-1]
        last_ni = hist.net_income[-1]
        projected_fcfe = []
        
        current_revenue = last_revenue
        for i in range(5):
            # Revenue and margin projections
            growth = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4)
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (i / 4)
            
            current_revenue *= (1 + growth)
            ebitda = current_revenue * margin
            
            # Simplified: Net Income ≈ EBITDA * (1 - tax_rate) * 0.7 (rough D&A and interest adjustment)
            net_income = ebitda * (1 - proj.tax_rate) * 0.7
            
            # Estimate CapEx and ΔNWc as % of revenue
            capex = current_revenue * 0.05  # 5% of revenue
            delta_nwc = current_revenue * 0.02  # 2% of revenue
            
            # Get net borrowing from debt schedule
            net_borrowing = debt_schedule[i].net_borrowing if i < len(debt_schedule) else 0
            
            # FCFE calculation
            fcfe = net_income - capex - delta_nwc + net_borrowing
            projected_fcfe.append(fcfe)
        
        # Terminal Value using Gordon Growth
        last_fcfe = projected_fcfe[-1]
        terminal_value = last_fcfe * (1 + dcfe_input.terminal_growth_rate) / (dcfe_input.cost_of_equity - dcfe_input.terminal_growth_rate)
        
        # Discount using Cost of Equity
        present_value = 0
        for i, fcfe in enumerate(projected_fcfe):
            present_value += fcfe / ((1 + dcfe_input.cost_of_equity) ** (i + 1))
        
        present_value += terminal_value / ((1 + dcfe_input.cost_of_equity) ** 5)
        
        # This is equity value directly (no need to subtract net debt)
        return present_value * 1000000

    def _calculate_precedent_transactions(self, pt_input) -> float:
        """
        Calculate valuation using Precedent Transactions Analysis
        Uses median/mean of transaction multiples applied to target metrics
        """
        if not pt_input or not pt_input.transactions:
            return 0.0
        
        # Calculate multiples for each transaction
        ev_revenue_multiples = []
        ev_ebitda_multiples = []
        
        for txn in pt_input.transactions:
            if txn.ev_revenue_multiple > 0:
                ev_revenue_multiples.append(txn.ev_revenue_multiple)
            if txn.ev_ebitda_multiple > 0:
                ev_ebitda_multiples.append(txn.ev_ebitda_multiple)
        
        # Calculate median or mean
        if pt_input.use_median:
            import statistics
            ev_rev_multiple = statistics.median(ev_revenue_multiples) if ev_revenue_multiples else 0
            ev_ebitda_multiple = statistics.median(ev_ebitda_multiples) if ev_ebitda_multiples else 0
        else:
            ev_rev_multiple = sum(ev_revenue_multiples) / len(ev_revenue_multiples) if ev_revenue_multiples else 0
            ev_ebitda_multiple = sum(ev_ebitda_multiples) / len(ev_ebitda_multiples) if ev_ebitda_multiples else 0
        
        # Apply multiples to target company
        val_by_revenue = pt_input.target_revenue * ev_rev_multiple
        val_by_ebitda = pt_input.target_ebitda * ev_ebitda_multiple
        
        # Average of both methods
        if val_by_revenue > 0 and val_by_ebitda > 0:
            return ((val_by_revenue + val_by_ebitda) / 2) * 1000000
        elif val_by_revenue > 0:
            return val_by_revenue * 1000000
        elif val_by_ebitda > 0:
            return val_by_ebitda * 1000000
        else:
            return 0.0


    def _calculate_lbo(self, lbo_input) -> float:
        """
        Calculate Leveraged Buyout Analysis
        Returns implied equity value based on target IRR
        Also calculates actual IRR and MOIC for given entry price
        """
        if not lbo_input:
            return 0.0
        
        # Entry valuation
        entry_ev = lbo_input.entry_ebitda * lbo_input.entry_ev_ebitda_multiple
        
        # Financing structure
        debt = entry_ev * lbo_input.debt_percentage
        equity_investment = entry_ev * (1 - lbo_input.debt_percentage)
        
        # Project financials over holding period
        current_revenue = lbo_input.entry_revenue
        cash_flows = []
        
        for year in range(lbo_input.holding_period):
            # Revenue growth
            current_revenue *= (1 + lbo_input.revenue_growth_rate)
            
            # EBITDA
            ebitda = current_revenue * lbo_input.ebitda_margin
            
            # Cash flow available for debt paydown
            # Simplified: EBITDA - Interest - CapEx - ΔNWc
            interest_expense = debt * lbo_input.debt_interest_rate
            capex = current_revenue * lbo_input.capex_percentage
            delta_nwc = current_revenue * lbo_input.nwc_percentage * lbo_input.revenue_growth_rate
            
            fcf = ebitda - interest_expense - capex - delta_nwc
            
            # Debt paydown (use excess cash flow)
            debt_paydown = max(0, fcf * 0.5)  # Use 50% of FCF for debt paydown
            debt = max(0, debt - debt_paydown)
            
            cash_flows.append(fcf)
        
        # Exit valuation
        exit_ebitda = current_revenue * lbo_input.ebitda_margin
        exit_ev = exit_ebitda * lbo_input.exit_ev_ebitda_multiple
        
        # Proceeds to equity
        equity_proceeds = exit_ev - debt
        
        # Calculate IRR
        # Cash flows: -equity_investment at t=0, then annual cash flows, then exit proceeds
        import numpy as np
        
        try:
            cf_array = [-equity_investment] + [0] * (lbo_input.holding_period - 1) + [equity_proceeds]
            irr = np.irr(cf_array)
            
            # MOIC (Multiple on Invested Capital)
            moic = equity_proceeds / equity_investment if equity_investment > 0 else 0
            
            # Store detailed results in a way that can be accessed
            # For now, return the entry EV as the valuation
            # In a real implementation, you might want to return more detailed results
            
            return entry_ev * 1000000  # Scale to actual units
            
        except:
            # If IRR calculation fails, return entry valuation
            return entry_ev * 1000000



    def _calculate_confidence_score(self, valuation_input, methods_used) -> ConfidenceScore:
        """
        Calculate a confidence score (0-100) based on input quality and method variance.
        """
        score = 100.0
        factors = []
        
        # 1. Input Quality Deductions
        if not valuation_input.dcf_input:
            score -= 30
            factors.append("Missing DCF inputs")
        else:
            hist = valuation_input.dcf_input.historical
            if len(hist.years) < 3:
                score -= 10
                factors.append("Limited historical data (< 3 years)")
            
            proj = valuation_input.dcf_input.projections
            if not proj.working_capital:
                score -= 5
                factors.append("Simplified working capital assumptions")
                
        if not valuation_input.gpc_input or not valuation_input.gpc_input.peer_tickers:
            score -= 15
            factors.append("No peer comparison (GPC) provided")
            
        # 2. Method Variance Deductions
        if len(methods_used) > 1:
            values = [m["value"] for m in methods_used.values()]
            avg_val = sum(values) / len(values)
            # Calculate max deviation from mean
            max_dev = max([abs(v - avg_val) for v in values])
            pct_dev = max_dev / avg_val if avg_val > 0 else 0
            
            if pct_dev > 0.2: # >20% deviation
                deduction = min(20, pct_dev * 50) # Cap at 20 points
                score -= deduction
                factors.append(f"High variance between valuation methods ({int(pct_dev*100)}%)")
        
        # Cap score
        score = max(0, min(100, score))
        
        # Determine rating
        if score >= 80: rating = "High"
        elif score >= 50: rating = "Medium"
        else: rating = "Low"
        
        return ConfidenceScore(score=round(score), rating=rating, factors=factors)

    def _generate_strategic_alerts(self, valuation_input, enterprise_value) -> List[StrategicAlert]:
        """
        Generate strategic alerts based on financial health and valuation metrics.
        """
        alerts = []
        
        if not valuation_input.dcf_input:
            return alerts
            
        dcf = valuation_input.dcf_input
        proj = dcf.projections
        
        # 1. Leverage Alert
        # Proxy: Net Debt / EV (since we have EV calculated)
        if enterprise_value > 0:
            leverage_ratio = dcf.net_debt / enterprise_value
            if leverage_ratio > 0.6: # Debt is >60% of EV
                alerts.append(StrategicAlert(
                    id="alert_lev_1",
                    type="critical",
                    message=f"High Leverage: Net Debt is {int(leverage_ratio*100)}% of Enterprise Value",
                    severity="high"
                ))
        
        # 2. Growth Alert
        if proj.revenue_growth_end < 0.02:
            alerts.append(StrategicAlert(
                id="alert_growth_1",
                type="warning",
                message="Long-term growth assumption (<2%) may be too conservative vs inflation",
                severity="medium"
            ))
            
        # 3. Margin Compression Alert
        if proj.ebitda_margin_end < proj.ebitda_margin_start:
            alerts.append(StrategicAlert(
                id="alert_margin_1",
                type="info",
                message="Projecting EBITDA margin compression over forecast period",
                severity="low"
            ))
            
        # 4. WACC Alert
        if proj.discount_rate > 0.15:
             alerts.append(StrategicAlert(
                id="alert_wacc_1",
                type="warning",
                message=f"High Discount Rate ({proj.discount_rate*100}%) significantly impacts valuation",
                severity="medium"
            ))
            
        return alerts

    def _generate_action_items(self, valuation_input, enterprise_value) -> List[ActionItem]:
        """
        Generate actionable tasks for the analyst.
        """
        actions = []
        
        if not valuation_input.dcf_input:
             actions.append(ActionItem(id="act_1", task="Input DCF assumptions", status="urgent", priority="high"))
             return actions
             
        proj = valuation_input.dcf_input.projections
        
        # 1. Review Growth
        if proj.revenue_growth_start > 0.20:
             actions.append(ActionItem(
                 id="act_growth", 
                 task="Validate high near-term growth assumptions (>20%)", 
                 status="urgent", 
                 priority="high"
             ))
             
        # 2. Tax Rate Check
        if proj.tax_rate < 0.15:
            actions.append(ActionItem(
                id="act_tax",
                task="Confirm effective tax rate (seems low)",
                status="pending",
                priority="medium"
            ))
            
        # 3. Peer Set
        if not valuation_input.gpc_input:
            actions.append(ActionItem(
                id="act_peers",
                task="Add comparable companies for GPC analysis",
                status="pending",
                priority="medium"
            ))
            
        # 4. Sensitivity
        if not valuation_input.sensitivity_analysis:
            actions.append(ActionItem(
                id="act_sens",
                task="Configure sensitivity analysis variables",
                status="completed", # Assuming default is handled
                priority="low"
            ))
            
        return actions
