import sqlite3
import os

DB_FILE = "valuation_v2.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found. Nothing to migrate.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        print("Migrating 'users' table...")
        
        # Add is_demo
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_demo BOOLEAN DEFAULT 0")
            print("Added column: is_demo")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("Column 'is_demo' already exists.")
            else:
                print(f"Error adding 'is_demo': {e}")

        # Add api_keys
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN api_keys TEXT")
            print("Added column: api_keys")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("Column 'api_keys' already exists.")
            else:
                print(f"Error adding 'api_keys': {e}")

        conn.commit()
        print("Migration complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
