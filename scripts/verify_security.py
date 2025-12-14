import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

from backend.database.models import User, UserRole, AuditLog, init_db, SessionLocal
from backend.services.audit_service import AuditLogger
from backend.auth.permissions import check_permission, Permissions
from backend.utils.encryption import encryption_manager

def test_encryption():
    print("\n--- Testing Encryption ---")
    original_text = "Secret Financial Data"
    encrypted = encryption_manager.encrypt(original_text)
    decrypted = encryption_manager.decrypt(encrypted)
    
    print(f"Original: {original_text}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {decrypted}")
    
    assert original_text != encrypted
    assert original_text == decrypted
    print("✅ Encryption test passed")

def test_rbac():
    print("\n--- Testing RBAC Permissions ---")
    
    # Test Viewer
    assert check_permission(UserRole.viewer, Permissions.VIEW_COMPANY) == True
    assert check_permission(UserRole.viewer, Permissions.CREATE_VALUATION) == False
    print("✅ Viewer permissions passed")
    
    # Test Analyst
    assert check_permission(UserRole.analyst, Permissions.CREATE_VALUATION) == True
    assert check_permission(UserRole.analyst, Permissions.DELETE_VALUATION) == False
    print("✅ Analyst permissions passed")
    
    # Test Admin
    assert check_permission(UserRole.admin, Permissions.MANAGE_USERS) == True
    print("✅ Admin permissions passed")

def test_audit_logging():
    print("\n--- Testing Audit Logging ---")
    db = SessionLocal()
    try:
        logger = AuditLogger(db)
        
        # Create a dummy user for testing if not exists
        user = db.query(User).filter_by(email="audit_test@example.com").first()
        if not user:
            user = User(
                email="audit_test@example.com",
                name="Audit Tester",
                role=UserRole.admin
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Log an action
        logger.log(
            action_type="TEST_ACTION",
            user_id=user.id,
            resource_type="test_resource",
            resource_id="123",
            details={"test": "data"}
        )
        
        # Verify log exists
        log = db.query(AuditLog).filter_by(action_type="TEST_ACTION", user_id=user.id).order_by(AuditLog.timestamp.desc()).first()
        
        assert log is not None
        assert log.resource_type == "test_resource"
        assert log.resource_id == "123"
        print("✅ Audit logging passed")
        
    finally:
        db.close()

if __name__ == "__main__":
    try:
        # Ensure DB is initialized
        init_db()
        
        test_encryption()
        test_rbac()
        test_audit_logging()
        
        print("\n🎉 All Security Tests Passed!")
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
