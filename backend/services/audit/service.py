from datetime import datetime
from typing import Optional, Dict, Any
import json
from sqlalchemy.orm import Session
from backend.database.models import SessionLocal, AuditLog
import threading

class AuditService:
    def log(self, action: str, user_id: Optional[int], resource: Optional[str] = None, details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None):
        """
        Log a sensitive action asynchronously.
        """
        threading.Thread(target=self._log_sync, args=(action, user_id, resource, details, ip_address)).start()
        
    def _log_sync(self, action_type, user_id, resource_type, details, ip_address):
        db: Session = SessionLocal()
        try:
            # Handle resource_type mapping from simple resource string if needed
            res_id = None
            if resource_type and ":" in resource_type:
                resource_type, res_id = resource_type.split(":", 1)

            log_entry = AuditLog(
                action_type=action_type,
                user_id=user_id,
                resource_type=resource_type,
                resource_id=res_id,
                details=json.dumps(details) if isinstance(details, dict) else details,
                ip_address=ip_address,
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Failed to write audit log: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db.close()

audit_service = AuditService()
