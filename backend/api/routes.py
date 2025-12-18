from fastapi import APIRouter
from backend.api.endpoints import valuation, dashboard, export, financials, scenarios

router = APIRouter()

# Mount sub-routers
router.include_router(valuation.router, tags=["Valuation"])
router.include_router(dashboard.router, tags=["Dashboard"])
router.include_router(export.router, tags=["Export"])
router.include_router(financials.router, tags=["Financials"])
router.include_router(scenarios.router, tags=["Scenarios"])

@router.get("/health")
def health_check():
    return {"status": "ok"}
