import sqlite3
import os

db_path = "valuation_v2.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

new_columns = [
    ("valuation_date", "DATETIME"),
    ("revenue_ltm", "FLOAT"),
    ("ebitda_ltm", "FLOAT"),
    ("wacc", "FLOAT"),
    ("financials_json", "TEXT"),
    ("valuation_summary_json", "TEXT")
]

for col_name, col_type in new_columns:
    try:
        print(f"Adding column {col_name}...")
        cursor.execute(f"ALTER TABLE valuation_runs ADD COLUMN {col_name} {col_type}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"Column {col_name} already exists.")
        else:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
print("Migration complete.")
