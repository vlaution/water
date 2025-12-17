import sys
import os
from sqlmodel import Session, create_engine, select

# Ensure backend can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.append(project_root)

from backend.database.models import Base, Regulation, RegulatoryAlert
from backend.services.regulatory_service import RegulatoryService

# 1. Setup Test DB
try:
    os.remove("./test_reg.db")
except FileNotFoundError:
    pass

sqlite_url = "sqlite:///./test_reg.db"
engine = create_engine(sqlite_url)
Base.metadata.create_all(engine)
session = Session(engine)

def verify_regulatory():
    print("=== Testing Regulatory Change Management ===")
    
    service = RegulatoryService(session)
    
    # 2. Simulate Poll
    print("\n[1] Fetching Updates (First Run)...")
    updates = service.fetch_updates()
    print(f"Ingested: {len(updates)}")
    
    if len(updates) > 0 and updates[0].name == "ASC 820 Update":
        print("PASS: Regulation Ingested.")
    else:
        print("FAIL: No updates or incorrect regulation.")
        return

    # 3. Check Alerts
    print("\n[2] Checking Alerts...")
    alerts = service.get_alerts()
    print(f"Total Alerts: {len(alerts)}")
    
    asc_alert = next((a for a in alerts if "ASC 820" in a.description), None)
    if asc_alert:
        print(f"PASS: Alert Created: {asc_alert.description}")
        print(f"Severity: {asc_alert.severity}")
    else:
        print("FAIL: Alert missing.")

    # 4. Idempotency Check
    print("\n[3] Fetching Updates Again (Should be empty)...")
    updates_2 = service.fetch_updates()
    print(f"Ingested: {len(updates_2)}")
    
    if len(updates_2) == 0:
        print("PASS: Idempotency confirmed (no duplicates).")
    else:
        print("FAIL: Dubplicate regulations ingested.")

if __name__ == "__main__":
    verify_regulatory()
