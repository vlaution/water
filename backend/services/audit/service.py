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
        
    def _log_sync(self, action, user_id, resource, details, ip_address):
        db: Session = SessionLocal()
        try:
            log_entry = AuditLog(
                action=action,
                user_id=user_id,
                resource=resource,
                details=json.dumps(details) if details else None,
                ip_address=ip_address,
                timestamp=datetime.utcnow()
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Failed to write audit log: {e}")
        finally:
            db.close()

audit_service = AuditService()
