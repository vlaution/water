import numpy as np
from typing import List, Dict
from backend.calculations.monte_carlo_models import (
    MonteCarloRequest, MonteCarloResult, SimulationVariable, 
    DistributionType, SimulationStatistic, HistogramBucket
)

class MonteCarloService:
    def run_simulation(self, request: MonteCarloRequest) -> MonteCarloResult:
        """
        Runs a Monte Carlo simulation based on the provided request.
        """
        results = []
        
        # Pre-parse variables for faster access inside the loop
        vars_map = {v.name: v for v in request.variables}
        
        # Base assumptions
        base_growth = 0.05 # Default if not simulated
        base_margin = 0.20 # Default if not simulated
        base_wacc = 0.10   # Default if not simulated
        
        for _ in range(request.iterations):
            # 1. Sample Variables
            growth_rate = self._sample_variable(vars_map.get("revenue_growth"), base_growth)
            ebitda_margin = self._sample_variable(vars_map.get("ebitda_margin"), base_margin)
            wacc = self._sample_variable(vars_map.get("wacc"), base_wacc)
            
            # 2. Run Simplified DCF
            ev = self._calculate_simplified_dcf(
                request.base_revenue,
                request.projection_years,
                growth_rate,
                ebitda_margin,
                request.tax_rate,
                wacc,
                request.terminal_growth_rate
            )
            results.append(ev)
            
        # 3. Calculate Statistics
        results_array = np.array(results)
        stats = SimulationStatistic(
            mean=float(np.mean(results_array)),
            median=float(np.median(results_array)),
            std_dev=float(np.std(results_array)),
            min=float(np.min(results_array)),
            max=float(np.max(results_array)),
            p10=float(np.percentile(results_array, 10)),
            p90=float(np.percentile(results_array, 90))
        )
        
        # 4. Generate Histogram
        hist, bin_edges = np.histogram(results_array, bins=20)
        histogram = []
        for i in range(len(hist)):
            histogram.append(HistogramBucket(
                range_start=float(bin_edges[i]),
                range_end=float(bin_edges[i+1]),
                frequency=int(hist[i])
            ))
            
        return MonteCarloResult(
            statistics=stats,
            histogram=histogram,
            iterations_run=request.iterations
        )

    def _sample_variable(self, variable: SimulationVariable, default_value: float) -> float:
        if not variable:
            return default_value
            
        params = variable.params
        if variable.distribution == DistributionType.NORMAL:
            return np.random.normal(params.get("mean", default_value), params.get("std_dev", 0.01))
        elif variable.distribution == DistributionType.TRIANGULAR:
            return np.random.triangular(params.get("min"), params.get("mode"), params.get("max"))
        elif variable.distribution == DistributionType.UNIFORM:
            return np.random.uniform(params.get("min"), params.get("max"))
        
        return default_value

    def _calculate_simplified_dcf(
        self, 
        start_revenue: float, 
        years: int, 
        growth_rate: float, 
        margin: float, 
        tax_rate: float, 
        wacc: float, 
        terminal_growth: float
    ) -> float:
        """
        Lightweight DCF engine for simulation.
        Assumes constant growth and margin for simplicity in this version.
        """
        pv_flows = 0.0
        current_revenue = start_revenue
        
        # Projection Period
        for i in range(1, years + 1):
            current_revenue *= (1 + growth_rate)
            ebitda = current_revenue * margin
            # Simplified Free Cash Flow: EBITDA * (1 - Tax) - Reinvestment (proxy)
            # Assuming Reinvestment (CapEx + NWC) is roughly equal to Depreciation for steady state, 
            # or simply taking a proxy. Let's use NOPAT proxy for now: EBIT * (1-t).
            # Approximating EBIT as 80% of EBITDA (Depreciation ~ 20% of EBITDA)
            ebit = ebitda * 0.8 
            nopat = ebit * (1 - tax_rate)
            
            # Simple FCF proxy: NOPAT (assuming high level reinvestment matches depreciation)
            fcf = nopat 
            
            # Discount
            pv_flows += fcf / ((1 + wacc) ** i)
            
        # Terminal Value
        # Last year FCF
        last_fcf = fcf 
        terminal_value = (last_fcf * (1 + terminal_growth)) / (wacc - terminal_growth)
        pv_terminal = terminal_value / ((1 + wacc) ** years)
        
        return pv_flows + pv_terminal
