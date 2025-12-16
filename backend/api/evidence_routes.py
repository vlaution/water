from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session
from typing import List, Optional
from backend.database.models import get_db, EvidenceAttachment, ReviewComment
from backend.services.evidence_service import EvidenceService

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

@router.post("/upload")
def upload_evidence(
    valuation_id: str = Form(...),
    description: str = Form(""),
    source_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Uploads a screenshot or links a URL as evidence.
    """
    service = EvidenceService(db)
    
    file_path = None
    if file:
        # In a real app, save to S3 or local disk
        # For prototype, we just mock the path
        file_path = f"/uploads/{valuation_id}/{file.filename}"
        # Simulate saving
        # with open(file_path, "wb") as buffer:
        #     shutil.copyfileobj(file.file, buffer)
            
    attachment = service.add_attachment(
        valuation_id=valuation_id,
        file_path=file_path,
        source_url=source_url,
        description=description
    )
    return attachment

@router.get("/{valuation_id}/attachments")
def get_attachments(valuation_id: str, db: Session = Depends(get_db)):
    service = EvidenceService(db)
    return service.get_attachments(valuation_id)

@router.post("/comment")
def add_comment(
    valuation_id: str,
    text: str,
    user_id: int = 1, # Mock user
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    service = EvidenceService(db)
    return service.add_comment(valuation_id, text, user_id, parent_id)

@router.get("/{valuation_id}/comments")
def get_comments(valuation_id: str, db: Session = Depends(get_db)):
    service = EvidenceService(db)
    return service.get_comments(valuation_id)
