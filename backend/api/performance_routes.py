from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from backend.utils.cache import cache
from backend.services.metrics.aggregator import aggregate_metrics
from backend.auth.dependencies import get_current_user, admin_required
from backend.database.models import UserRole

router = APIRouter(prefix="/api/performance", tags=["performance"])

@router.get("/summary")
async def get_performance_summary(user: dict = Depends(admin_required)):
    """
    Get aggregated performance metrics.
    """
    # Try to get from cache
    sys_summary = cache.get_sync("metrics:system_summary")
    val_summary = cache.get_sync("metrics:valuation_summary")
    
    if not sys_summary or not val_summary:
        # Trigger aggregation if missing
        aggregate_metrics()
        sys_summary = cache.get_sync("metrics:system_summary")
        val_summary = cache.get_sync("metrics:valuation_summary")
        
    return {
        "system": sys_summary or {},
        "valuation": val_summary or {}
    }

@router.post("/aggregate")
async def trigger_aggregation(user: dict = Depends(admin_required)):
    """
    Manually trigger aggregation.
    """
    aggregate_metrics()
    return {"status": "success", "message": "Aggregation triggered"}
