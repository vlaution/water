# import pandas as pd
# import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import ValuationRun
import json

class CorrelationService:
    def __init__(self, db: Session):
        self.db = db

    def get_portfolio_data(self) -> Any:
        import pandas as pd
        """
        Fetches valuation data and structures it for analysis.
        For MVP, we fetch all valuations. In future, filter by portfolio_id.
        """
        valuations = self.db.query(ValuationRun).all()
        
        data = []
        for v in valuations:
            try:
                inputs = json.loads(v.input_data)
                results = json.loads(v.results)
                
                # Extract metrics
                # Handle missing or different structures gracefully
                dcf = inputs.get("dcf_input", {})
                projections = dcf.get("projections", {})
                
                # Financial Metrics
                rev_growth = projections.get("revenue_growth_start", 0.0)
                ebitda_margin = projections.get("ebitda_margin_start", 0.0)
                
                # Qualitative Metrics
                # Assuming 'industry' might be in historical or a top-level field
                hist = dcf.get("historical", {})
                industry = hist.get("industry", "Unknown")
                
                data.append({
                    "id": v.id,
                    "company_name": v.company_name,
                    "revenue_growth": float(rev_growth),
                    "ebitda_margin": float(ebitda_margin),
                    "industry": industry
                })
            except Exception as e:
                print(f"Error processing valuation {v.id}: {e}")
                continue
                
        return pd.DataFrame(data)

    def calculate_correlation_matrix(self) -> Dict[str, Any]:
        """
        Calculates correlation matrix for the portfolio.
        """
        df = self.get_portfolio_data()
        
        if df.empty:
            return {"companies": [], "matrix": []}
            
        # 1. Financial Correlation (Pearson)
        # We want correlation BETWEEN companies based on their metrics.
        # This is tricky: usually correlation is between variables (e.g. Rev Growth vs EBITDA).
        # To find correlation between COMPANIES, we need a vector of features for each company.
        # Then we compute similarity/correlation between these vectors.
        
        # Features: Revenue Growth, EBITDA Margin
        # We can also add dummy variables for Industry.
        
        # Normalize numerical features
        numeric_cols = ["revenue_growth", "ebitda_margin"]
        
        # Simple approach: Distance/Similarity matrix
        # If we want "Correlation", we can transpose: Companies as columns, Metrics as rows.
        # But metrics have different scales. We should standardize.
        
        features = df[numeric_cols].copy()
        
        # Standardize
        features = (features - features.mean()) / features.std()
        features = features.fillna(0) # Handle NaN if std is 0
        
        # Add Industry dummies? 
        # For MVP, let's stick to financial correlation first.
        # Transpose so columns are companies
        features_T = features.T
        features_T.columns = df["company_name"]
        
        # Calculate Correlation Matrix (Company vs Company)
        # Note: With only 2 data points (Rev Growth, EBITDA), correlation might be noisy.
        # But this is the requested "Financial Metric Correlation".
        corr_matrix = features_T.corr(method='pearson')
        
        # Replace NaN with 0 (happens if variance is 0)
        corr_matrix = corr_matrix.fillna(0)
        
        # Convert to list of lists for frontend
        matrix_data = corr_matrix.values.tolist()
        companies = df["company_name"].tolist()
        
        return {
            "companies": companies,
            "matrix": matrix_data,
            "metrics_used": numeric_cols
        }

    def calculate_qualitative_similarity(self) -> Dict[str, Any]:
        """
        Calculates similarity based on qualitative factors (Industry).
        """
        df = self.get_portfolio_data()
        if df.empty:
            return {"companies": [], "matrix": []}
            
        companies = df["company_name"].tolist()
        n = len(companies)
        import numpy as np
        matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    # Simple matching coefficient for Industry
                    ind_i = df.iloc[i]["industry"]
                    ind_j = df.iloc[j]["industry"]
                    matrix[i][j] = 1.0 if ind_i == ind_j and ind_i != "Unknown" else 0.0
                    
        return {
            "companies": companies,
            "matrix": matrix.tolist(),
            "metrics_used": ["industry"]
        }
