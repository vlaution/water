from fastapi import APIRouter, Depends
from backend.services.system.health_monitor import health_monitor_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/system-health")
async def get_system_health():
    """Get real-time system health metrics."""
    return health_monitor_service.get_metrics()
