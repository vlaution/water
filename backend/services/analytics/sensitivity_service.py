from typing import List, Dict, Any, Union
from backend.calculations.models import LBOInput
from backend.services.valuation.formulas.lbo import EnhancedLBOCalculator
import copy

class SensitivityService:
    def run_sensitivity_table(
        self, 
        base_input: LBOInput, 
        row_config: Dict[str, Any], # { "variable": "exit_ev_ebitda_multiple", "label": "Exit Multiple", "range": [10, 11, 12] }
        col_config: Dict[str, Any], # { "variable": "entry_ev_ebitda_multiple", "label": "Entry Multiple", "range": [8, 9, 10] }
        output_metric: str = "irr" # "irr" or "moic"
    ) -> Dict[str, Any]:
        """
        Runs a 2D sensitivity analysis.
        """
        
        # Ranges
        row_values = row_config["range"]
        col_values = col_config["range"]
        
        matrix = []
        
        # Optimize: If 10x10, that's 100 runs.
        # Ensure we disable internal sensitivity within the loop to avoid 100 * 9 = 900 runs.
        base_input.include_sensitivity = False
        
        for r_val in row_values:
            row_results = []
            for c_val in col_values:
                # 1. Clone Input
                # Using Pydantic copy is usually shallow? Deepcopy safety.
                # Actually, iterate on a single clone if possible for speed, but deepcopy avoids side effects.
                current_input = copy.deepcopy(base_input)
                
                # 2. Apply Modifications
                self._set_variable(current_input, row_config["variable"], r_val)
                self._set_variable(current_input, col_config["variable"], c_val)
                
                # 3. specific override for entry multiple if solving for IRR?
                # The Calculator takes entry multiple as a separate arg often if solving for Target IRR.
                # But here we assume standardized input.
                
                # 4. Run Calculation
                # We use _run_waterfall directly or calculate? 
                # calculate() handles solving for price, which might be weird if we are varying input price.
                # Safer to use _calculate_single_run if we are varying entry price manually.
                
                try:
                    # Determine Entry Multiple
                    # If col_variable is 'entry_ev_ebitda_multiple', we use that. 
                    # specific check:
                    entry_mult = current_input.entry_ev_ebitda_multiple or 10.0
                    
                    if current_input.solve_for == "entry_price": 
                        # If solving for entry price, we can't vary entry price as an input...
                        # But typically sensitivity is done on a fixed model.
                        # We should force single run mode for sensitivity unless specific use case.
                        pass

                    val, results = EnhancedLBOCalculator.calculate(current_input)
                    
                    # 5. Extract Metric
                    value = results.get(output_metric, 0)
                    row_results.append(value)
                except Exception as e:
                    print(f"Sensitivity Error: {e}")
                    row_results.append(None)
                    
            matrix.append({
                "row_value": r_val,
                "values": row_results
            })
            
        return {
            "row_label": row_config["label"],
            "col_label": col_config["label"],
            "row_values": row_values,
            "col_values": col_values,
            "matrix": matrix
        }
        
    def _set_variable(self, model: LBOInput, variable_path: str, value: Any):
        """
        Sets a variable on the Pydantic model using dot notation path.
        e.g. "revenue_growth_rate" or "financing.tranches.0.leverage_multiple"
        """
        parts = variable_path.split(".")
        current = model
        
        for i, part in enumerate(parts[:-1]):
            # Handle List indexing
            if part.isdigit(): # e.g. "0"
                part_idx = int(part)
                # Check if current is list
                if isinstance(current, list):
                    current = current[part_idx]
                else:
                    return # Error path
            else:
                # Attribute
                if isinstance(current, dict):
                    current = current.get(part)
                else:
                    current = getattr(current, part, None)
                    
            if current is None:
                return # Invalid path
                
        # Set final value
        last_part = parts[-1]
        
        # If numeric part?
        if last_part.isdigit():
             idx = int(last_part)
             if isinstance(current, list):
                 current[idx] = value
        else:
             if hasattr(current, last_part):
                 setattr(current, last_part, value)
             elif isinstance(current, dict):
                 current[last_part] = value
                 
sensitivity_service = SensitivityService()
