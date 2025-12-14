from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.models import get_db, User
from backend.auth.dependencies import get_current_user
from backend.services.risk.correlation_service import CorrelationService

router = APIRouter(prefix="/api/risk", tags=["risk"])

@router.get("/correlation/financial")
async def get_financial_correlation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get correlation matrix based on financial metrics (Revenue Growth, EBITDA Margin).
    """
    service = CorrelationService(db)
    return service.calculate_correlation_matrix()

@router.get("/correlation/qualitative")
async def get_qualitative_correlation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get similarity matrix based on qualitative factors (Industry/Sector).
    """
    service = CorrelationService(db)
    return service.calculate_qualitative_similarity()

from backend.services.risk.stress_test_service import StressTestService
from backend.calculations.risk_models import StressScenario, PortfolioStressTestResponse

@router.get("/scenarios", response_model=list[StressScenario])
async def get_stress_scenarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available stress test scenarios.
    """
    service = StressTestService(db)
    return service.get_scenarios()

@router.post("/stress-test/{scenario_name}", response_model=PortfolioStressTestResponse)
async def run_stress_test(
    scenario_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run a specific stress test scenario on the portfolio.
    """
    service = StressTestService(db)
    return service.run_stress_test(scenario_name)

from backend.services.risk.concentration_service import ConcentrationService

@router.get("/concentration/sector")
async def get_sector_concentration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ConcentrationService(db)
    return service.get_sector_concentration()

@router.get("/concentration/stage")
async def get_stage_concentration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ConcentrationService(db)
    return service.get_stage_concentration()

@router.get("/concentration/power-law")
async def get_power_law_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ConcentrationService(db)
    return service.get_power_law_metrics()

from backend.services.risk.health_service import HealthService
from backend.calculations.risk_models import PortfolioHealthResponse

@router.get("/health", response_model=PortfolioHealthResponse)
async def get_portfolio_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = HealthService(db)
    return service.calculate_portfolio_health()
