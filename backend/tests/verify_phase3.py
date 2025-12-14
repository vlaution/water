import sys
import os
import time
from sqlalchemy import text

# Add project root to path (parent of backend)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.database.models import SessionLocal, AuditLog, init_db
from backend.services.audit.service import audit_service
from backend.services.features.flags import feature_flags

def test_audit_logging():
    print("\n🧪 Testing Audit Logging...")
    
    # Log an action
    audit_service.log(
        action="TEST_ACTION",
        user_id=1,
        resource="test:123",
        details={"foo": "bar"},
        ip_address="127.0.0.1"
    )
    
    # Wait for async write
    time.sleep(1)
    
    # Verify
    db = SessionLocal()
    log = db.query(AuditLog).filter(AuditLog.action == "TEST_ACTION").order_by(AuditLog.id.desc()).first()
    
    if log and log.resource == "test:123":
        print("✅ Audit Log written successfully!")
    else:
        print("❌ Audit Log failed to write.")
    db.close()

def test_feature_flags():
    print("\n🧪 Testing Feature Flags...")
    
    # Check default
    if feature_flags.is_enabled("new_valuation_engine"):
        print("✅ Default flag 'new_valuation_engine' is True")
    else:
        print("❌ Default flag check failed")
        
    # Check override
    feature_flags.set_flag("test_flag", True)
    if feature_flags.is_enabled("test_flag"):
        print("✅ Runtime flag override works")
    else:
        print("❌ Runtime flag override failed")

if __name__ == "__main__":
    print("🚀 Starting Phase 3 Verification")
    init_db()
    
    test_audit_logging()
    test_feature_flags()
    
    print("\n✨ Verification Complete")
