from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.advisory.lbo_advisory_service import lbo_advisory_service

router = APIRouter(prefix="/api/advisory", tags=["Advisory"])

@router.get("/structure")
async def get_debt_structure_advice(sector: str, ebitda: float = 0):
    """
    Get recommended debt structure based on sector and market conditions.
    """
    try:
        return lbo_advisory_service.suggest_debt_structure(sector, ebitda)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
