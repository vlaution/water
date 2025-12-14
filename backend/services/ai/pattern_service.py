import json
import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from backend.database.models import SessionLocal, ValidationPattern, UserFeedback
import os

class PatternRecognitionService:
    def __init__(self, data_path="historical_valuations.json"):
        self.data_path = data_path
        self.df = None
        self.scaler = StandardScaler()

    def load_data(self):
        """Loads historical data from JSON or Database."""
        if os.path.exists(self.data_path):
            with open(self.data_path, 'r') as f:
                data = json.load(f)
            self.df = pd.DataFrame(data)
            print(f"Loaded {len(self.df)} records from {self.data_path}")
        else:
            print("No historical data found.")
            self.df = pd.DataFrame()

    def preprocess_features(self):
        """Normalizes features for clustering."""
        if self.df is None or self.df.empty:
            return
        
        # We focus on Revenue Growth and EBITDA Margin for clustering
        features = self.df[['revenue_growth', 'ebitda_margin']].copy()
        
        # Handle outliers before clustering (optional, but good for stability)
        # For now, we just use standard scaling
        self.scaled_features = self.scaler.fit_transform(features)
        self.df[['scaled_growth', 'scaled_margin']] = self.scaled_features

    def train_patterns(self):
        """
        Implements 3-Layer Clustering:
        1. Sector (Industry)
        2. Size (Revenue Tiers - simulated here as we don't have absolute revenue in synthetic data yet, 
           so we will skip Size for now or simulate it)
        3. Stage (Growth/Margin profile via K-Means)
        """
        if self.df is None or self.df.empty:
            return

        db = SessionLocal()
        try:
            # Clear old patterns
            db.query(ValidationPattern).delete()
            
            sectors = self.df['sector'].unique()
            
            for sector in sectors:
                sector_df = self.df[self.df['sector'] == sector].copy()
                
                if len(sector_df) < 10:
                    print(f"Skipping {sector}: Not enough data ({len(sector_df)} records)")
                    continue

                # K-Means Clustering for "Stage" (e.g., Early High Growth vs. Mature Profitable)
                # We'll try 3 clusters per sector
                kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(sector_df[['scaled_growth', 'scaled_margin']])
                sector_df['cluster'] = cluster_labels

                # Analyze each cluster
                for cluster_id in range(3):
                    cluster_data = sector_df[sector_df['cluster'] == cluster_id]
                    
                    if cluster_data.empty:
                        continue

                    # Calculate Centroids and Ranges
                    avg_growth = cluster_data['revenue_growth'].mean()
                    avg_margin = cluster_data['ebitda_margin'].mean()
                    
                    # Determine Archetype Name based on centroid
                    archetype_name = self._name_archetype(avg_growth, avg_margin)
                    full_cluster_name = f"{sector}_{archetype_name}".lower().replace(" ", "_")

                    # Create Pattern Record
                    pattern = ValidationPattern(
                        pattern_type="cluster_archetype",
                        severity="info", # These are informational baselines
                        message_template=f"Similar {sector} companies ({archetype_name}) typically have Growth: {{growth}} and Margin: {{margin}}",
                        condition_json=json.dumps({
                            "sector": sector,
                            "cluster_id": int(cluster_id),
                            "avg_growth": round(avg_growth, 4),
                            "avg_margin": round(avg_margin, 4),
                            "growth_range": [round(cluster_data['revenue_growth'].quantile(0.25), 4), round(cluster_data['revenue_growth'].quantile(0.75), 4)],
                            "margin_range": [round(cluster_data['ebitda_margin'].quantile(0.25), 4), round(cluster_data['ebitda_margin'].quantile(0.75), 4)],
                            "sample_size": int(len(cluster_data))
                        })
                    )
                    db.add(pattern)
                    print(f"Created Pattern: {full_cluster_name} (n={len(cluster_data)})")

            db.commit()
            print("Pattern training complete. Patterns saved to DB.")

        except Exception as e:
            print(f"Error training patterns: {e}")
            db.rollback()
        finally:
            db.close()

    def _name_archetype(self, growth, margin):
        """Names the cluster based on its characteristics."""
        if growth > 0.20:
            if margin < 0:
                return "High Growth Aggressive"
            else:
                return "High Growth Profitable"
        elif growth > 0.05:
            if margin > 0.20:
                return "Efficient Growth"
            else:
                return "Balanced Growth"
        else:
            if margin > 0.15:
                return "Mature Cash Cow"
            else:
                return "Distressed / Turnaround"

    def get_pattern_accuracy(self) -> Dict[str, Any]:
        """Calculates pattern acceptance rate based on user feedback."""
        db = SessionLocal()
        try:
            # Total stats for pattern matches
            total_feedback = db.query(UserFeedback).filter(UserFeedback.anomaly_field == "pattern_match").count()
            accepted = db.query(UserFeedback).filter(UserFeedback.anomaly_field == "pattern_match", UserFeedback.user_action == "accept").count()
            
            accuracy = (accepted / total_feedback) if total_feedback > 0 else 0.0
            
            return {
                "total_matches_feedback": total_feedback,
                "accepted_matches": accepted,
                "accuracy_rate": accuracy
            }
        except Exception as e:
            print(f"Error calculating accuracy: {e}")
            return {"error": str(e)}
        finally:
            db.close()

if __name__ == "__main__":
    service = PatternRecognitionService()
    service.load_data()
    service.preprocess_features()
    service.train_patterns()
