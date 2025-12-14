from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.services.historical_data_service import HistoricalDataService
from typing import Dict, Any

router = APIRouter(prefix="/api/historical", tags=["historical"])

@router.get("/benchmarks/{sector}")
async def get_sector_benchmarks(sector: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get LBO benchmark statistics for a specific sector.
    Returns EV/EBITDA, Leverage, IRR stats, and Success Rate.
    """
    service = HistoricalDataService(db)
    benchmarks = service.get_benchmarks(sector)
    if not benchmarks:
         # Return empty structure rather than 404 to avoid frontend errors
         return {
            "count": 0,
            "ev_ebitda": {"mean": 0, "min": 0, "max": 0},
            "leverage": {"mean": 0, "max": 0},
            "irr": {"mean": 0, "median": 0},
            "success_rate": 0
        }
    return benchmarks
