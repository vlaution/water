from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from backend.database.models import get_db, RegulatoryAlert
from backend.services.regulatory_service import RegulatoryService

router = APIRouter(prefix="/api/regulatory", tags=["regulatory"])

@router.post("/fetch-updates")
def fetch_updates(db: Session = Depends(get_db)):
    """
    Trigger manual poll for regulatory updates.
    """
    service = RegulatoryService(db)
    new_regs = service.fetch_updates()
    return {"message": f"Ingested {len(new_regs)} new regulations", "new_regulations": new_regs}

@router.get("/alerts")
def get_alerts(unread_only: bool = False, db: Session = Depends(get_db)):
    service = RegulatoryService(db)
    return service.get_alerts(unread_only)
