import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import ValuationRun
# import pandas as pd
# import numpy as np

class ConcentrationService:
    def __init__(self, db: Session):
        self.db = db

    def _get_portfolio_df(self) -> Any:
        import pandas as pd
        valuations = self.db.query(ValuationRun).all()
        data = []
        for v in valuations:
            try:
                inputs = json.loads(v.input_data)
                results = json.loads(v.results)
                
                # Extract Base Value (EV)
                base_value = results.get("enterprise_value", 0.0)
                if base_value == 0:
                     base_value = results.get("dcf_valuation", {}).get("enterprise_value", 0.0)

                # Extract Metadata
                # Assuming these fields exist in input_data structure or we infer them
                dcf = inputs.get("dcf_input", {})
                hist = dcf.get("historical", {})
                
                sector = hist.get("industry", "Unknown")
                # Stage inference (proxy via revenue or explicit field)
                revenue = dcf.get("projections", {}).get("revenue_start", 0)
                if revenue < 1_000_000:
                    stage = "Seed"
                elif revenue < 10_000_000:
                    stage = "Series A"
                elif revenue < 50_000_000:
                    stage = "Growth"
                else:
                    stage = "Late Stage"

                data.append({
                    "company_name": v.company_name,
                    "value": base_value,
                    "sector": sector,
                    "stage": stage
                })
            except Exception:
                continue
        
        return pd.DataFrame(data)

    def get_sector_concentration(self) -> Dict[str, Any]:
        df = self._get_portfolio_df()
        if df.empty:
            return {"labels": [], "values": []}
            
        # Group by Sector
        sector_dist = df.groupby("sector")["value"].sum().sort_values(ascending=False)
        
        return {
            "labels": sector_dist.index.tolist(),
            "values": sector_dist.values.tolist(),
            "total_value": float(sector_dist.sum())
        }

    def get_stage_concentration(self) -> Dict[str, Any]:
        df = self._get_portfolio_df()
        if df.empty:
            return {"labels": [], "values": []}
            
        # Group by Stage
        stage_dist = df.groupby("stage")["value"].sum().sort_values(ascending=False)
        
        return {
            "labels": stage_dist.index.tolist(),
            "values": stage_dist.values.tolist(),
            "total_value": float(stage_dist.sum())
        }

    def get_power_law_metrics(self) -> Dict[str, Any]:
        """
        Calculate Gini Coefficient and Top-N concentration.
        """
        df = self._get_portfolio_df()
        if df.empty:
            return {"gini": 0.0, "top_3_percent": 0.0}
            
        import numpy as np
        values = df["value"].sort_values(ascending=True).values
        n = len(values)
        if n == 0: return {"gini": 0.0, "top_3_percent": 0.0}
        
        # Gini Coefficient
        # (Mean absolute difference) / (2 * mean)
        # Simplified: (2 * sum(i * xi) / (n * sum(xi))) - (n + 1) / n
        index = np.arange(1, n + 1)
        gini = ((2 * np.sum(index * values)) / (n * np.sum(values))) - ((n + 1) / n)
        
        # Top 3 Concentration
        total_value = np.sum(values)
        top_3_value = np.sum(sorted(values, reverse=True)[:3])
        top_3_pct = top_3_value / total_value if total_value > 0 else 0.0
        
        return {
            "gini_coefficient": float(gini),
            "top_3_percent": float(top_3_pct),
            "is_power_law_compliant": float(gini) > 0.6  # Heuristic: High inequality is "good" for VC
        }
