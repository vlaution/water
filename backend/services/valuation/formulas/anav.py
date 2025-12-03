from backend.calculations.models import ANAVInput

class ANAVCalculator:
    @staticmethod
    def calculate(anav_input: ANAVInput) -> float:
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
