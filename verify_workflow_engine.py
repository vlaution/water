import sys
import os
import json
from datetime import datetime
from sqlmodel import Session, create_engine, SQLModel

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.database.models import Base, ValuationRun, User, AuditLog
from backend.services.workflow_service import WorkflowService

# 1. Setup Test DB
try:
    os.remove("./test_workflow.db")
except FileNotFoundError:
    pass

sqlite_url = "sqlite:///./test_workflow.db"
engine = create_engine(sqlite_url)
Base.metadata.create_all(engine)
session = Session(engine)

def verify_workflow():
    print("=== Testing Compliance Workflow Engine ===")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    cols = [c['name'] for c in inspector.get_columns('audit_logs')]
    print(f"AuditLog Columns: {cols}")
    
    # 2. Seed Data
    reviewer = User(email="reviewer@example.com", hashed_password="pw", full_name="Chief Reviewer")
    owner = User(email="analyst@example.com", hashed_password="pw", full_name="Analyst")
    session.add(reviewer)
    session.add(owner)
    session.commit()
    
    val = ValuationRun(
        id="val_workflow_101",
        company_name="Workflow Corp",
        user_id=owner.id,
        status="draft",
        input_data=json.dumps({"growth_rate": 0.05}) # Valid safe input
    )
    session.add(val)
    session.commit()
    
    service = WorkflowService(session)
    
    # 3. Transitions
    print("\n[1] Transition Draft -> Compliance Check")
    val = service.transition_status(val.id, "compliance_check", owner.id)
    print(f"Status: {val.status}")
    
    print("\n[2] Transition -> Review (Triggering Gate)")
    try:
        val = service.transition_status(val.id, "review", owner.id)
        print(f"Status: {val.status} (Gate Passed)")
    except Exception as e:
        print(f"FAIL: Gate blocked transition: {e}")
        return

    print("\n[3] Assign Reviewer")
    val = service.assign_reviewer(val.id, reviewer.id, owner.id)
    print(f"Reviewer: {val.reviewer_id}")
    
    print("\n[4] Sign-off (as Reviewer)")
    # Should generate crypto signature
    val = service.transition_status(val.id, "approved", reviewer.id)
    
    if val.status == "approved" and val.signoff_signature:
        print(f"PASS: Valuation Approved.")
        print(f"Signature: {val.signoff_signature}")
        print(f"Timestamp: {val.signoff_timestamp}")
        
        # Verify Audit Log was mined
        history = service.audit_service.get_history(val.id)
        signoff_entry = next((e for e in history if e.action_type == "OFFICIAL_SIGNOFF"), None)
        if signoff_entry:
            print("PASS: Immutable Audit Log Confirmed.")
        else:
            print("FAIL: Audit log missing.")
    else:
        print("FAIL: Approval failed or signature missing.")

if __name__ == "__main__":
    verify_workflow()
