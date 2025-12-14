from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.models import get_db, User, ValuationRun, ValuationMetric, SystemMetric, AuditLog
from backend.auth.dependencies import get_current_user
from backend.services.audit.service import audit_service

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])

@router.post("/forget-me", status_code=status.HTTP_200_OK)
async def forget_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Right to be Forgotten.
    Deletes all data associated with the requesting user.
    """
    user_id = int(current_user['sub'])
    
    try:
        # 1. Delete Valuations
        db.query(ValuationRun).filter(ValuationRun.user_id == user_id).delete()
        
        # 2. Delete Valuation Metrics
        db.query(ValuationMetric).filter(ValuationMetric.user_id == user_id).delete()
        
        # 3. Anonymize System Metrics (set user_id to NULL)
        # We don't delete to preserve aggregate stats, but remove PII link
        db.query(SystemMetric).filter(SystemMetric.user_id == user_id).update({SystemMetric.user_id: None})
        
        # 4. Delete Audit Logs (or anonymize?)
        # Usually audit logs are kept for security, but GDPR might require deletion if they contain PII.
        # Let's delete user-specific logs.
        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
        
        # 5. Delete User Account
        db.query(User).filter(User.id == user_id).delete()
        
        db.commit()
        
        # Log this action (anonymously)
        audit_service.log(
            action="GDPR_DELETE",
            user_id=None,
            resource=f"user:{user_id}",
            details={"status": "completed"}
        )
        
        return {"message": "All your data has been permanently deleted."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process deletion: {str(e)}")
