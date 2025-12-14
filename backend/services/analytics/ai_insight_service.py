from typing import List, Dict, Any
from backend.calculations.models import ValuationInput

class AIInsightService:
    @staticmethod
    def generate_insights(results: Dict[str, Any], input_data: ValuationInput) -> Dict[str, Any]:
        """
        Generates structured insights based on valuation results and inputs.
        Simulates an AI Analyst.
        """
        insights = {
            "strategic_assessment": [],
            "risk_factors": [],
            "upside_potential": []
        }
        
        try:
            # 1. Strategic Assessment ( Valuation & Drivers )
            ev = results.get('enterprise_value', 0) or 0
            dcf_val = results.get('methods', {}).get('DCF_FCFF', {}).get('value', 0) or 0
            gpc_val = results.get('methods', {}).get('GPC', {}).get('value', 0) or 0
            
            if dcf_val > 0 and gpc_val > 0:
                diff = (dcf_val - gpc_val) / gpc_val
                if diff > 0.15:
                    insights["strategic_assessment"].append(
                        "Intrinsic value (DCF) significantly exceeds market pricing (>15%), suggesting the market may be undervaluing the company's long-term growth potential."
                    )
                elif diff < -0.15:
                    insights["strategic_assessment"].append(
                        "Market multiples imply a higher value than current cash flow projections support, indicating potential overvaluation or high embedded growth expectations."
                    )
                else:
                     insights["strategic_assessment"].append(
                        "Intrinsic and relative valuation methods are well-aligned, providing high confidence in the estimated fair value range."
                    )

            # 2. Risk Factors ( Margins, Leverage, Concentration )
            # Margin Trend
            if input_data.dcf_input and input_data.dcf_input.projections:
                start_margin = input_data.dcf_input.projections.ebitda_margin_start or 0
                end_margin = input_data.dcf_input.projections.ebitda_margin_end or 0
                if end_margin > start_margin + 0.05:
                    insights["risk_factors"].append(
                        f"Valuation relies on significant margin expansion (+{(end_margin-start_margin)*100:.1f}%), which may be challenging to execute."
                    )
            
            # Leverage risk (using LBO or DCF debt if available)
            # Simplified check
            
            # 3. Upside Potential
            # Growth
            if input_data.dcf_input and input_data.dcf_input.projections:
                growth = input_data.dcf_input.projections.revenue_growth_start or 0
                if growth > 0.20:
                     insights["upside_potential"].append(
                        "High revenue growth trajectory positions the company to capture significant market share."
                    )
            
            # LBO
            if results.get('lbo_details'):
                irr = results['lbo_details'].get('irr', 0) or 0
                if irr > 0.25:
                     insights["upside_potential"].append(
                        f"Strong LBO economics (IRR {irr*100:.1f}%) make this an attractive target for financial sponsors, potentially setting a floor on valuation."
                    )

            # Fallbacks if empty
            if not insights["strategic_assessment"]:
                insights["strategic_assessment"].append("Valuation appears robust based on provided inputs.")
        
        except Exception as e:
            # Fallback for ANY error during generation to prevent 500
            print(f"AI Insight Generation Failed: {e}")
            insights["strategic_assessment"].append("Automated insights unavailable for this scenario.")
            
        return insights
