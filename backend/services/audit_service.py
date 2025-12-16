from typing import List, Dict, Any
from sqlmodel import Session, select
from datetime import datetime
from backend.database.models import AuditLog

class AuditService:
    def __init__(self, session: Session = None):
        self.session = session # In prod, dependency injection

    def log_event(self, user_id: str, action: str, resource_type: str, resource_id: str, details: Dict[str, Any] = None):
        """
        Logs an event to the audit trail.
        Attributes risk level based on action type.
        """
        risk_level = self._assess_risk(action)
        
        log_entry = AuditLog(
            user_id=user_id,
            action_type=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            risk_level=risk_level
        )
        
        if self.session:
            self.session.add(log_entry)
            self.session.commit()
            self.session.refresh(log_entry)
        else:
            # Fallback for demo/no-db mode
            print(f"[AUDIT] {datetime.now()} | {user_id} | {action} | {resource_id}")

    def get_history(self, resource_id: str) -> List[AuditLog]:
        if not self.session:
            return []
        statement = select(AuditLog).where(AuditLog.resource_id == resource_id).order_by(AuditLog.timestamp.desc())
        return self.session.execute(statement).scalars().all()

    def _assess_risk(self, action: str) -> str:
        high_risk_actions = ["DELETE_VALUATION", "OVERRIDE_MARKET_DATA", "BYPASS_APPROVAL"]
        medium_risk_actions = ["UPDATE_ASSUMPTION", "CHANGE_METHODOLOGY"]
        
        if action in high_risk_actions:
            return "high"
        if action in medium_risk_actions:
            return "medium"
        return "low"

# Alias for backward compatibility 
AuditLogger = AuditService
