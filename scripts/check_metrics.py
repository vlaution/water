
import sys
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.models import ValuationMetric, SessionLocal, User, UserRole

def get_metrics():
    db = SessionLocal()
    try:
        metrics = db.query(ValuationMetric).all()
        
        if not metrics:
            print("No valuation metrics recorded yet.")
            return

        data = [{
            "method": m.method_type,
            "duration": m.duration_ms,
            "cache_hit": m.cache_hit,
            "complexity": m.input_complexity_score,
            "created_at": m.created_at
        } for m in metrics]
        
        df = pd.DataFrame(data)
        
        print("\n--- Valuation Metrics Report ---")
        print(f"Total Valuations Run: {len(df)}")
        
        print("\n[Method Popularity]")
        if "method" in df.columns:
            counts = df["method"].value_counts(normalize=True) * 100
            for method, pct in counts.items():
                print(f"  - {method}: {pct:.1f}%")
        
        print("\n[Performance Stats]")
        if "duration" in df.columns:
            print(f"  - Avg Duration: {df['duration'].mean():.2f} ms")
            print(f"  - Fastest: {df['duration'].min():.2f} ms")
            print(f"  - Slowest: {df['duration'].max():.2f} ms")
            
        if "cache_hit" in df.columns:
            hit_rate = df["cache_hit"].mean() * 100
            print(f"  - Cache Hit Rate: {hit_rate:.1f}%")

        if "complexity" in df.columns:
             print(f"  - Avg Input Complexity: {df['complexity'].mean():.2f}")

    finally:
        db.close()

if __name__ == "__main__":
    get_metrics()
