import os
import secrets
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/valuation_db")
engine = create_engine(DATABASE_URL)

def run_migration():
    print(f"Connecting to DB: {DATABASE_URL}")
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # 1. Add 'state' and 'acknowledgement_hash' to decision_records
        print("Migrating decision_records...")
        try:
            conn.execute(text("ALTER TABLE decision_records ADD COLUMN state VARCHAR(50) DEFAULT 'active'"))
            print("  Added 'state' column.")
        except Exception as e:
            print(f"  'state' column exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE decision_records ADD COLUMN acknowledgement_hash VARCHAR(64)"))
            print("  Added 'acknowledgement_hash' column.")
        except Exception as e:
            print(f"  'acknowledgement_hash' column exists or error: {e}")

        # 2. Add Outcome fields
        try:
            conn.execute(text("ALTER TABLE decision_records ADD COLUMN actual_outcome VARCHAR(50)"))
            print("  Added 'actual_outcome' column.")
        except Exception as e:
             print(f"  'actual_outcome' column exists or error: {e}")

        try:
            conn.execute(text("ALTER TABLE decision_records ADD COLUMN outcome_notes TEXT"))
            print("  Added 'outcome_notes' column.")
        except Exception as e:
             print(f"  'outcome_notes' column exists or error: {e}")
             
        try:
            conn.execute(text("ALTER TABLE decision_records ADD COLUMN outcome_recorded_at TIMESTAMP"))
            print("  Added 'outcome_recorded_at' column.")
        except Exception as e:
             print(f"  'outcome_recorded_at' column exists or error: {e}")

        # 3. Create AcknowledgementRecord table if not exists (using raw SQL for speed/robustness vs model.metadata)
        # Actually models.metadata.create_all handles new tables well.
        
        print("\nMigration checks complete.")

if __name__ == "__main__":
    run_migration()
