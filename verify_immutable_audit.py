import sys
import os
import time
from datetime import datetime

# Ensure backend can be imported
sys.path.append(os.getcwd())

from sqlmodel import SQLModel, create_engine, Session, select
from backend.models.audit import AuditLog
from backend.services.immutable_audit import ImmutableAuditService

# Use in-memory DB for test to avoid polluting main DB
sqlite_url = "sqlite://"
engine = create_engine(sqlite_url)

def verify_immutable_ledger():
    print("=== Testing Immutable Audit Ledger ===")
    
    # 1. Setup DB
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    service = ImmutableAuditService(session)
    
    # 2. Log Events (Mining Blocks)
    print("\n[1] Mining 3 Blocks...")
    
    # Block 1
    b1 = service.log_event_cryptographic("user_1", "LOGIN", "system", "auth")
    print(f"Block 1 Mined: Hash={b1.hash[:10]}... Nonce={b1.nonce}")
    
    # Block 2
    b2 = service.log_event_cryptographic("user_1", "VIEW_VALUATION", "valuation", "val_123")
    print(f"Block 2 Mined: Hash={b2.hash[:10]}... Prev={b2.previous_hash[:10]}...")
    
    # Block 3
    b3 = service.log_event_cryptographic("user_1", "EXPORT_REPORT", "report", "rep_999")
    print(f"Block 3 Mined: Hash={b3.hash[:10]}... Prev={b3.previous_hash[:10]}...")
    
    # 3. Verify Integrity (Should be valid)
    print("\n[2] Verifying Integrity (Expect VALID)...")
    res = service.verify_chain_integrity()
    if res["status"] == "valid":
        print("PASS: Chain is valid.")
    else:
        print(f"FAIL: Chain invalid: {res}")
        
    # 4. Tamper Test
    print("\n[3] Simulating Tampering (Modifying Block 2)...")
    # Malicious actor changes the action type in the DB directly
    b2.action_type = "DELETE_VALUATION" 
    session.add(b2)
    session.commit()
    
    # 5. Verify Integrity (Should detect tampering)
    print("[4] Verifying Integrity (Expect COMPROMISED)...")
    res_tamper = service.verify_chain_integrity()
    
    if res_tamper["status"] == "compromised":
        print("PASS: Tampering detected!")
        print(f"Details: {res_tamper['broken_blocks']}")
    else:
        print("FAIL: Tampering NOT detected.")

if __name__ == "__main__":
    verify_immutable_ledger()
