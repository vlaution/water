from backend.calculations.transformer import DataTransformer
from typing import Dict, Any, Optional, List
from backend.calculations.models import ConfidenceScore, StrategicAlert, ActionItem, SensitivityInput, PWSARequest, PWSAResult, ScenarioResult, RiskMetrics, VCMethodResult, AuditIssue, ValuationInput
from backend.parser.models import WorkbookData
from backend.utils.cache import cache
import hashlib
import json

# Import new services
from backend.services.valuation.formulas.dcf import DCFCalculator
from backend.services.valuation.formulas.fcfe import FCFECalculator
from backend.services.valuation.formulas.gpc import GPCCalculator
from backend.services.valuation.formulas.lbo import LBOCalculator
from backend.services.valuation.formulas.precedent_transactions import PrecedentTransactionsCalculator
from backend.services.valuation.formulas.anav import ANAVCalculator
from backend.services.valuation.formulas.vc_method import VCMethodCalculator
from backend.services.validation.assumption_validator import AssumptionValidator

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

    def calculate(self, valuation_input: ValuationInput) -> Dict[str, Any]:
        # 1. Check Cache
        cache_key = self._generate_cache_key(valuation_input)
        cached_result = cache.get_sync(cache_key)
        if cached_result:
            return cached_result

        # Perform calculations using new services
        dcf_value, dcf_flows, dcf_details = DCFCalculator.calculate(valuation_input.dcf_input)
        gpc_value = GPCCalculator.calculate(valuation_input.gpc_input)
        fcfe_value = FCFECalculator.calculate(valuation_input.dcfe_input)
        pt_value = PrecedentTransactionsCalculator.calculate(valuation_input.precedent_transactions_input)
        lbo_value = LBOCalculator.calculate(valuation_input.lbo_input)
        anav_value = ANAVCalculator.calculate(valuation_input.anav_input)
        
        # VC Method
        vc_result = None
        vc_value = 0.0
        if valuation_input.vc_method_input:
            vc_result = VCMethodCalculator.calculate(valuation_input.vc_method_input)
            vc_value = vc_result.pre_money_valuation if vc_result else 0.0

        
        # Validation
        validation_errors = AssumptionValidator.validate_valuation_assumptions(valuation_input)
        warnings = [e.message for e in validation_errors if e.severity == "warning"]
        critical_errors = [e.message for e in validation_errors if e.severity == "error"]
        
        # Determine which methods were used and apply weights
        methods_used = {}
        
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
            if vc_value > 0: methods_used["VC_Method"] = {"value": vc_value, "weight": 0.0}
        else:
            # Use provided weights
            if dcf_value > 0: methods_used["DCF_FCFF"] = {"value": dcf_value, "weight": weights.dcf}
            if fcfe_value > 0: methods_used["DCF_FCFE"] = {"value": fcfe_value, "weight": weights.fcfe}
            if gpc_value > 0: methods_used["GPC"] = {"value": gpc_value, "weight": weights.gpc}
            if pt_value > 0: methods_used["Precedent_Transactions"] = {"value": pt_value, "weight": weights.precedent}
            if lbo_value > 0: methods_used["LBO"] = {"value": lbo_value, "weight": weights.lbo}
            if anav_value > 0: methods_used["ANAV"] = {"value": anav_value, "weight": weights.anav}
            if vc_value > 0: methods_used["VC_Method"] = {"value": vc_value, "weight": 0.0}

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
                    scenario_val, _, scenario_details = DCFCalculator.calculate(scenario_dcf_input)
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
            "critical_errors": critical_errors,
            "dcf_details": dcf_details if dcf_value > 0 else {},
            "input_summary": valuation_input.dict(),
            "confidence_score": self._calculate_confidence_score(valuation_input, methods_used),
            "strategic_alerts": self._generate_strategic_alerts(valuation_input, enterprise_value),
            "action_items": self._generate_action_items(valuation_input, enterprise_value),
            "vc_method": vc_result.dict() if vc_result else None,
            "cache_key": cache_key
        }
        
        # Cache the result
        cache.set_sync(cache_key, self.results, ttl=3600)
        
        return self.results

    def _generate_cache_key(self, valuation_input) -> str:
        # Convert to JSON-serializable dict, sorting keys for consistency
        input_dict = valuation_input.dict()
        serialized = json.dumps(input_dict, sort_keys=True, default=str)
        return f"valuation:{hashlib.sha256(serialized.encode()).hexdigest()}"

    def precompute_sensitivities(self, valuation_input, cache_key: str):
        """
        Precompute sensitivity matrix in the background.
        """
        if not valuation_input.dcf_input:
            return

        sensitivity_matrix = {}
        input_model = valuation_input
        
        # Precompute DCF sensitivities: WACC vs Terminal Growth
        # Range: WACC +/- 2%, Growth +/- 1%
        base_wacc = input_model.dcf_input.projections.discount_rate
        base_growth = input_model.dcf_input.projections.terminal_growth_rate
        
        wacc_deltas = [-0.02, -0.01, 0, 0.01, 0.02]
        growth_deltas = [-0.01, 0, 0.01]
        
        matrix_data = []
        
        for w_delta in wacc_deltas:
            row = []
            for g_delta in growth_deltas:
                # Create deep copy of input
                modified_input = input_model.copy(deep=True)
                modified_input.dcf_input.projections.discount_rate = base_wacc + w_delta
                modified_input.dcf_input.projections.terminal_growth_rate = base_growth + g_delta
                
                # Recalculate just the DCF value
                result = DCFCalculator.calculate(modified_input.dcf_input)
                if isinstance(result, tuple):
                    val = result[0]
                else:
                    val = result
                row.append(val)
            matrix_data.append(row)
            
        sensitivity_result = {
            "x_axis": {"name": "terminal_growth_rate", "values": [base_growth + g for g in growth_deltas]},
            "y_axis": {"name": "discount_rate", "values": [base_wacc + w for w in wacc_deltas]},
            "matrix": matrix_data
        }

        # Store the precomputed matrix
        cache.set_sync(f"sensitivity_{cache_key}", sensitivity_result, ttl=86400) # 24 hours

    def calculate_pwsa(self, request: PWSARequest) -> PWSAResult:
        """
        Calculate Probability-Weighted Scenario Analysis
        """
        # 1. Normalize Probabilities
        total_prob = sum(s.probability for s in request.scenarios)
        if total_prob == 0:
            raise ValueError("Total probability cannot be zero")
            
        normalized_scenarios = []
        for s in request.scenarios:
            # Create a copy to avoid mutating input
            norm_s = s.copy()
            norm_s.probability = s.probability / total_prob
            normalized_scenarios.append(norm_s)
            
        # 2. Calculate individual scenario valuations
        scenario_results = []
        values = []
        
        for scenario in normalized_scenarios:
            # Run full valuation for this scenario
            result = self.calculate(scenario.assumptions)
            val = result["enterprise_value"]
            
            scenario_results.append(ScenarioResult(
                name=scenario.name,
                value=val,
                probability=scenario.probability
            ))
            values.append(val)
            
        # 3. Calculate Weighted Average
        weighted_value = sum(r.value * r.probability for r in scenario_results)
        
        # 4. Calculate Risk Metrics
        import numpy as np
        
        # Standard Deviation
        variance = sum(r.probability * ((r.value - weighted_value) ** 2) for r in scenario_results)
        std_dev = variance ** 0.5
        
        # Value at Risk (VaR) - 95%
        sorted_scenarios = sorted(scenario_results, key=lambda x: x.value)
        cum_prob = 0
        var_95 = sorted_scenarios[0].value # Default to lowest
        
        for s in sorted_scenarios:
            cum_prob += s.probability
            if cum_prob >= 0.05:
                var_95 = s.value
                break
                
        # Upside Potential (Best Case)
        upside = max(values) if values else 0
        
        risk_metrics = RiskMetrics(
            var_95=var_95,
            upside_potential=upside,
            standard_deviation=std_dev
        )
        
        return PWSAResult(
            probability_weighted_value=weighted_value,
            scenario_results=scenario_results,
            risk_metrics=risk_metrics
        )

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
                temp_proj = base_proj.copy()
                
                if sensitivity_input.variable_1 == "discount_rate":
                    temp_proj.discount_rate = r_val
                elif sensitivity_input.variable_1 == "terminal_growth_rate":
                    temp_proj.terminal_growth_rate = r_val
                
                if sensitivity_input.variable_2 == "discount_rate":
                    temp_proj.discount_rate = c_val
                elif sensitivity_input.variable_2 == "terminal_growth_rate":
                    temp_proj.terminal_growth_rate = c_val
                
                # Run DCF
                temp_dcf_input = dcf_input.copy()
                temp_dcf_input.projections = temp_proj
                val, _, _ = DCFCalculator.calculate(temp_dcf_input)
                row_data.append(val)
            matrix.append(row_data)
            
        return {
            "x_axis": {"name": sensitivity_input.variable_2, "values": cols},
            "y_axis": {"name": sensitivity_input.variable_1, "values": rows},
            "matrix": matrix
        }

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
        alerts = []
        # Placeholder
        return alerts

    def _generate_action_items(self, valuation_input, enterprise_value) -> List[ActionItem]:
        items = []
        # Placeholder
        return items
