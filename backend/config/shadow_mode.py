import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.database.models import AuditLog

class ShadowModeConfig:
    # Configuration changes only allowed during weekly review (Saturday, Sunday)
    # Freeze Mon-Fri
    CONFIG_FREEZE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    @staticmethod
    def can_modify_config() -> bool:
        today = datetime.datetime.now().strftime("%A")
        return today not in ShadowModeConfig.CONFIG_FREEZE_DAYS
    
    @staticmethod
    def enforce_freeze(user_id: str, change_description: str, db: Session):
        """
        Check if config modification is allowed. 
        If frozen, log the attempt and raise 403.
        If allowed, log the change.
        """
        allowed = ShadowModeConfig.can_modify_config()
        
        # Log attempt
        log_entry = AuditLog(
            user_id=user_id,
            action="CONFIG_CHANGE_ATTEMPT",
            details=f"{change_description} | Allowed: {allowed}",
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Configuration changes are FROZEN during Shadow Mode (Mon-Fri). Attempt logged."
            )
            
        return True
