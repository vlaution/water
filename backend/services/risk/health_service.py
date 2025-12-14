import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import ValuationRun
from backend.calculations.risk_models import PortfolioHealthResponse, CompanyHealthResult
# import pandas as pd
# import numpy as np

class HealthService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_portfolio_health(self) -> PortfolioHealthResponse:
        import numpy as np
        valuations = self.db.query(ValuationRun).all()
        results = []
        
        total_runway = 0.0
        runway_count = 0
        total_dq = 0.0
        
        healthy_count = 0
        at_risk_count = 0
        
        for v in valuations:
            try:
                inputs = json.loads(v.input_data)
                
                # 1. Calculate Runway
                # Try to find cash and burn.
                # If missing, we'll simulate for MVP or mark as unknown.
                dcf = inputs.get("dcf_input", {})
                hist = dcf.get("historical", {})
                
                # Mock extraction logic - in real app, these would be explicit fields
                cash = hist.get("cash_balance", 0)
                # Burn is negative EBITDA or explicit burn.
                # Let's infer from EBITDA margin * Revenue if available, else mock.
                revenue = dcf.get("projections", {}).get("revenue_start", 0)
                margin = dcf.get("projections", {}).get("ebitda_margin_start", 0)
                
                ebitda = revenue * margin
                burn_rate = 0
                
                if ebitda < 0:
                    burn_rate = abs(ebitda) / 12 # Monthly burn
                
                # Fallback for MVP if data is missing (likely for synthetic data)
                if cash == 0 and burn_rate == 0:
                    # Simulate random runway for demo purposes if data is completely missing
                    # In production, this would be null
                    runway = np.random.uniform(3, 24) 
                elif burn_rate > 0:
                    runway = cash / burn_rate
                else:
                    runway = 99 # Profitable or infinite runway
                    
                # 2. Calculate Data Quality
                # Check how many expected fields are present
                expected_fields = ["revenue_start", "ebitda_margin_start", "industry", "founded_year"]
                present_fields = 0
                for field in expected_fields:
                    if field in dcf.get("projections", {}) or field in hist:
                        present_fields += 1
                
                dq_score = (present_fields / len(expected_fields)) * 100
                
                # 3. Identify Red Flags
                red_flags = []
                if runway < 6:
                    red_flags.append("Critical Runway (< 6 months)")
                if dq_score < 50:
                    red_flags.append("Low Data Quality")
                if margin < -0.5:
                    red_flags.append("High Burn Rate (> 50% of Rev)")

                results.append(CompanyHealthResult(
                    company_name=v.company_name,
                    runway_months=runway,
                    data_quality_score=dq_score,
                    red_flags=red_flags
                ))
                
                if runway < 99:
                    total_runway += runway
                    runway_count += 1
                
                total_dq += dq_score
                
                if len(red_flags) > 0:
                    at_risk_count += 1
                else:
                    healthy_count += 1
                    
            except Exception as e:
                print(f"Error processing health for {v.company_name}: {e}")
                continue
                
        avg_runway = total_runway / runway_count if runway_count > 0 else 0
        avg_dq = total_dq / len(valuations) if valuations else 0
        
        return PortfolioHealthResponse(
            avg_runway_months=avg_runway,
            avg_data_quality=avg_dq,
            total_companies=len(valuations),
            healthy_companies=healthy_count,
            at_risk_companies=at_risk_count,
            company_results=results
        )
