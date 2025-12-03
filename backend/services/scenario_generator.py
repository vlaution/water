from typing import Dict, Any, List, Optional, Callable
from backend.calculations.models import ValuationInput, ProjectionAssumptions
import copy

class ScenarioGeneratorService:
    def __init__(self):
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, Any]:
        """
        Define scenario templates with causal adjustment logic.
        Intensity is a multiplier (e.g., 0.5 = Low, 1.0 = Medium, 1.5 = High).
        """
        return {
            "market_share_gain": {
                "name": "Market Share Gain",
                "description": "Aggressive growth through customer acquisition",
                "explanation": "To gain market share, we project higher revenue growth but lower margins due to increased sales and marketing spend. Working capital requirements (DSO) will also increase as we offer better terms to customers.",
                "adjustments": {
                    "revenue_growth_start": lambda base, intensity: base + (0.05 * intensity),
                    "revenue_growth_end": lambda base, intensity: base + (0.03 * intensity),
                    "ebitda_margin_start": lambda base, intensity: base - (0.02 * intensity),
                    "ebitda_margin_end": lambda base, intensity: base - (0.01 * intensity),
                    "working_capital.dso": lambda base, intensity: base + (10 * intensity),
                    "capex_percent_revenue": lambda base, intensity: (base if base is not None else 0.04) + (0.015 * intensity)
                }
            },
            "cost_cutting": {
                "name": "Cost Cutting / Efficiency",
                "description": "Focus on profitability over growth",
                "explanation": "Lower revenue growth as unprofitable segments are pruned. Margins expand due to efficiency measures, and CapEx is reduced to maintenance levels.",
                "adjustments": {
                    "revenue_growth_start": lambda base, intensity: base - (0.03 * intensity),
                    "revenue_growth_end": lambda base, intensity: base - (0.01 * intensity),
                    "ebitda_margin_start": lambda base, intensity: base + (0.03 * intensity),
                    "ebitda_margin_end": lambda base, intensity: base + (0.04 * intensity),
                    "capex_percent_revenue": lambda base, intensity: max(0.01, (base if base is not None else 0.04) - (0.01 * intensity))
                }
            },
            "recession": {
                "name": "Recession / Downside",
                "description": "Economic downturn scenario",
                "explanation": "Significant hit to revenue growth and margins. CapEx is cut to preserve cash. Working capital cycle lengthens (slower collections).",
                "adjustments": {
                    "revenue_growth_start": lambda base, intensity: base - (0.10 * intensity),
                    "revenue_growth_end": lambda base, intensity: base - (0.05 * intensity),
                    "ebitda_margin_start": lambda base, intensity: base - (0.05 * intensity),
                    "ebitda_margin_end": lambda base, intensity: base - (0.02 * intensity),
                    "working_capital.dso": lambda base, intensity: base + (15 * intensity),
                    "capex_percent_revenue": lambda base, intensity: max(0.005, (base if base is not None else 0.04) - (0.02 * intensity))
                }
            },
            "blue_sky": {
                "name": "Blue Sky / Upside",
                "description": "Optimistic growth scenario",
                "explanation": "High revenue growth combined with margin expansion due to economies of scale. CapEx increases to support growth.",
                "adjustments": {
                    "revenue_growth_start": lambda base, intensity: base + (0.08 * intensity),
                    "revenue_growth_end": lambda base, intensity: base + (0.05 * intensity),
                    "ebitda_margin_start": lambda base, intensity: base + (0.02 * intensity),
                    "ebitda_margin_end": lambda base, intensity: base + (0.05 * intensity),
                    "capex_percent_revenue": lambda base, intensity: (base if base is not None else 0.04) + (0.01 * intensity)
                }
            }
        }

    def generate_scenario(self, base_inputs: ValuationInput, scenario_type: str, intensity: float) -> Dict[str, Any]:
        """
        Generate coherent scenario assumptions based on a template.
        """
        if not base_inputs.dcf_input:
            raise ValueError("DCF Inputs are required for scenario generation")

        template = self.templates.get(scenario_type)
        if not template:
            raise ValueError(f"Unknown scenario type: {scenario_type}")

        # Deep copy to avoid mutating original
        new_inputs = copy.deepcopy(base_inputs)
        projections = new_inputs.dcf_input.projections
        
        changes = []

        for field, adjustment_func in template["adjustments"].items():
            # Handle nested fields (e.g., working_capital.dso)
            if "." in field:
                parent_field, child_field = field.split(".")
                parent_obj = getattr(projections, parent_field)
                if parent_obj:
                    current_value = getattr(parent_obj, child_field)
                    new_value = adjustment_func(current_value, intensity)
                    setattr(parent_obj, child_field, new_value)
                    changes.append({
                        "field": field,
                        "old_value": current_value,
                        "new_value": new_value
                    })
            else:
                current_value = getattr(projections, field)
                new_value = adjustment_func(current_value, intensity)
                setattr(projections, field, new_value)
                changes.append({
                    "field": field,
                    "old_value": current_value,
                    "new_value": new_value
                })

        # Validate and Reconcile
        self._validate_and_reconcile(projections)

        return {
            "base_assumptions": base_inputs.dict(),
            "generated_assumptions": new_inputs.dict(),
            "changes": changes,
            "explanation": template["explanation"],
            "scenario_name": template["name"]
        }

    def _validate_and_reconcile(self, projections: ProjectionAssumptions):
        """
        Ensure generated assumptions are logical.
        """
        # 1. Margins cannot be > 100% or < -100% (usually)
        projections.ebitda_margin_start = max(-0.5, min(0.9, projections.ebitda_margin_start))
        projections.ebitda_margin_end = max(-0.5, min(0.9, projections.ebitda_margin_end))

        # 2. Revenue growth sanity (-50% to +200%)
        projections.revenue_growth_start = max(-0.5, min(2.0, projections.revenue_growth_start))
        
        # 3. CapEx cannot be negative
        if projections.capex_percent_revenue is not None:
            projections.capex_percent_revenue = max(0.0, projections.capex_percent_revenue)

        # 4. Working Capital sanity
        if projections.working_capital:
            projections.working_capital.dso = max(0, projections.working_capital.dso)
            projections.working_capital.dio = max(0, projections.working_capital.dio)
            projections.working_capital.dpo = max(0, projections.working_capital.dpo)
