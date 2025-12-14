import sys
import os

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.models import SessionLocal, IndustryNorm, init_db

def seed_norms():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if data exists
        if db.query(IndustryNorm).first():
            print("Industry norms already exist. Skipping seed.")
            return

        print("Seeding industry norms...")
        
        norms = [
            # SaaS
            IndustryNorm(sector="SaaS", metric="revenue_growth", mean=0.35, std_dev=0.15, percentile_25=0.20, percentile_75=0.50),
            IndustryNorm(sector="SaaS", metric="ebitda_margin", mean=0.10, std_dev=0.20, percentile_25=-0.10, percentile_75=0.30),
            IndustryNorm(sector="SaaS", metric="terminal_growth_rate", mean=0.03, std_dev=0.01, percentile_25=0.02, percentile_75=0.04),
            IndustryNorm(sector="SaaS", metric="wacc", mean=0.10, std_dev=0.02, percentile_25=0.08, percentile_75=0.12),
            
            # Biotech
            IndustryNorm(sector="Biotech", metric="revenue_growth", mean=0.50, std_dev=0.30, percentile_25=0.10, percentile_75=0.80),
            IndustryNorm(sector="Biotech", metric="ebitda_margin", mean=-0.20, std_dev=0.25, percentile_25=-0.40, percentile_75=0.00),
            IndustryNorm(sector="Biotech", metric="terminal_growth_rate", mean=0.02, std_dev=0.01, percentile_25=0.015, percentile_75=0.03),
            IndustryNorm(sector="Biotech", metric="wacc", mean=0.12, std_dev=0.03, percentile_25=0.10, percentile_75=0.15),
            
            # Consumer
            IndustryNorm(sector="Consumer", metric="revenue_growth", mean=0.08, std_dev=0.05, percentile_25=0.04, percentile_75=0.12),
            IndustryNorm(sector="Consumer", metric="ebitda_margin", mean=0.15, std_dev=0.08, percentile_25=0.08, percentile_75=0.20),
            IndustryNorm(sector="Consumer", metric="terminal_growth_rate", mean=0.025, std_dev=0.005, percentile_25=0.02, percentile_75=0.03),
            IndustryNorm(sector="Consumer", metric="wacc", mean=0.08, std_dev=0.02, percentile_25=0.06, percentile_75=0.10),
        ]
        
        db.add_all(norms)
        db.commit()
        print(f"Successfully added {len(norms)} industry norms.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_norms()
