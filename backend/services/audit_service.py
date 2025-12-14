from sqlalchemy.orm import Session
from backend.database.models import AuditLog
import json
from datetime import datetime
from typing import Optional, Any

class AuditLogger:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        action_type: str,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        before_state: Optional[dict] = None,
        after_state: Optional[dict] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None
    ):
        """
        Create an audit log entry.
        """
        try:
            log_entry = AuditLog(
                user_id=user_id,
                action_type=action_type,
                resource_type=resource_type,
                resource_id=resource_id,
                before_state=json.dumps(before_state) if before_state else None,
                after_state=json.dumps(after_state) if after_state else None,
                ip_address=ip_address,
                details=json.dumps(details) if details else None,
                timestamp=datetime.utcnow()
            )
            self.db.add(log_entry)
            self.db.commit()
        except Exception as e:
            print(f"Failed to create audit log: {e}")
            self.db.rollback()

    def log_login(self, user_id: int, ip_address: str, success: bool = True):
        self.log(
            action_type="LOGIN",
            user_id=user_id,
            ip_address=ip_address,
            details={"success": success}
        )

    def log_logout(self, user_id: int, ip_address: str):
        self.log(
            action_type="LOGOUT",
            user_id=user_id,
            ip_address=ip_address
        )

    def log_valuation_change(self, user_id: int, valuation_id: str, action: str, before: Optional[dict] = None, after: Optional[dict] = None, ip_address: Optional[str] = None):
        self.log(
            action_type=f"VALUATION_{action.upper()}",
            user_id=user_id,
            resource_type="valuation",
            resource_id=valuation_id,
            before_state=before,
            after_state=after,
            ip_address=ip_address
        )
