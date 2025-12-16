from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session
from backend.database.models import get_db
from backend.services.workflow_service import WorkflowService
from pydantic import BaseModel

router = APIRouter(prefix="/api/workflow", tags=["workflow"])

class TransitionRequest(BaseModel):
    valuation_id: str
    new_status: str
    user_id: int # Mock for now

class AssignRequest(BaseModel):
    valuation_id: str
    reviewer_id: int
    user_id: int # Assigner

@router.post("/transition")
def transition_status(req: TransitionRequest, db: Session = Depends(get_db)):
    service = WorkflowService(db)
    return service.transition_status(req.valuation_id, req.new_status, req.user_id)

@router.post("/assign")
def assign_reviewer(req: AssignRequest, db: Session = Depends(get_db)):
    service = WorkflowService(db)
    return service.assign_reviewer(req.valuation_id, req.reviewer_id, req.user_id)
