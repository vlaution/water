from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database.models import get_db, UserFeedback
from typing import Optional

router = APIRouter()

class FeedbackRequest(BaseModel):
    anomaly_field: str
    user_action: str # "accept", "dismiss", "correct"
    correction_value: Optional[float] = None
    context_data: Optional[str] = None

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    try:
        db_feedback = UserFeedback(
            anomaly_field=feedback.anomaly_field,
            user_action=feedback.user_action,
            correction_value=feedback.correction_value,
            context_data=feedback.context_data
        )
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        return {"status": "success", "id": db_feedback.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
