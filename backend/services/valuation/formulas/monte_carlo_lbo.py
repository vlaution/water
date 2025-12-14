from backend.calculations.models import LBOInput
from backend.services.valuation.formulas.lbo import LBOCalculator
from typing import Dict, Any, List
import numpy as np

class LBOMonteCarlo:
    @staticmethod
    def simulate(lbo_input: LBOInput, iterations: int = 1000) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation for LBO IRR.
        Variables randomized:
        1. Revenue Growth Rate (+/- 20% relative variability)
        2. EBITDA Margin (+/- 10% relative variability)
        3. Exit Multiple (+/- 1.0x absolute variability)
        """
        base_growth = lbo_input.revenue_growth_rate
        base_margin = lbo_input.ebitda_margin
        base_exit_mult = lbo_input.exit_ev_ebitda_multiple or 10.0
        
        irrs = []
        entry_ev = lbo_input.entry_ev_ebitda_multiple or 10.0
        
        # Vectorized generation of inputs would be faster, but since _run_waterfall 
        # is complex and sequential, we'll loop. 1000 iterations in Python might take 1-2s.
        
        for _ in range(iterations):
            # Randomize inputs
            # Normal distribution assumed
            sim_growth = np.random.normal(base_growth, base_growth * 0.20) # 20% std dev relative
            sim_margin = np.random.normal(base_margin, base_margin * 0.10) # 10% std dev relative
            sim_exit = np.random.normal(base_exit_mult, 1.0) # 1.0x std dev constant
            
            # Construct sim input
            # We clone delicately - deepcopy is slow
            sim_input = lbo_input.copy(deep=True)
            sim_input.revenue_growth_rate = sim_growth
            sim_input.ebitda_margin = sim_margin
            sim_input.exit_ev_ebitda_multiple = sim_exit
            sim_input.Assumptions = lbo_input.assumptions # Reference is fine if we don't mutate
            
            try:
                irr, _, _ = LBOCalculator._run_waterfall(sim_input, entry_ev)
                irrs.append(irr)
            except:
                irrs.append(0.0)
                
        # Analyze Results
        irrs = np.array(irrs)
        mean_irr = float(np.mean(irrs))
        median_irr = float(np.median(irrs))
        std_dev = float(np.std(irrs))
        
        # Probability of achieving Target IRR
        target = lbo_input.target_irr or 0.20
        prob_success = float(np.sum(irrs > target) / iterations)
        
        # Percentiles
        p5 = float(np.percentile(irrs, 5))
        p95 = float(np.percentile(irrs, 95))
        
        return {
            "iterations": iterations,
            "mean_irr": round(mean_irr, 4),
            "median_irr": round(median_irr, 4),
            "std_dev": round(std_dev, 4),
            "probability_success": round(prob_success, 4),
            "percentiles": {
                "p5": round(p5, 4),
                "p95": round(p95, 4)
            },
            "distribution": {
                # Simple histogram data (10 bins)
                "counts": np.histogram(irrs, bins=10)[0].tolist(),
                "bins": np.histogram(irrs, bins=10)[1].tolist()
            }
        }
