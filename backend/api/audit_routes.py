from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.models import get_db, AuditLog, User
from backend.auth.dependencies import get_current_user, admin_required
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[int]
    action_type: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    details: Optional[str]

    class Config:
        from_attributes = True

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    action_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """
    Get audit logs. Only accessible by admins.
    """
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
        
    # Order by newest first
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
