from backend.database.models import engine
from sqlalchemy import text

def add_updated_at_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE valuation_runs ADD COLUMN updated_at DATETIME"))
            print("✅ Added updated_at column to valuation_runs")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("ℹ️ Column updated_at already exists")
            else:
                print(f"❌ Failed to add column: {e}")

if __name__ == "__main__":
    add_updated_at_column()
