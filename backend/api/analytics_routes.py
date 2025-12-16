from fastapi import APIRouter, HTTPException, Body, Depends, Request
from typing import Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.api.auth_routes import get_current_user
from backend.database.models import User
from backend.services.audit_service import AuditLogger
from backend.calculations.models import LBOInput
from backend.services.analytics.sensitivity_service import sensitivity_service
from backend.services.analytics.debt_market_service import debt_market_service

from backend.services.analytics.market_aware_service import market_aware_service

from backend.services.analytics.transaction_radar_service import transaction_radar_service

from backend.services.analytics.refinancing_service import refinancing_service, RefinancingAnalysisRequest

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/debt-market")
async def get_debt_market_conditions():
    """Get current debt market rates and covenants."""
    return debt_market_service.get_current_conditions()

@router.get("/debt-market/history")
async def get_debt_market_history():
    """Get historical debt rate trends."""
    return debt_market_service.get_historical_trends()

@router.get("/market-data/rates")
async def get_market_rates():
    """Get current market rates for LBO modeling."""
    conditions = debt_market_service.get_current_conditions()
    # Map to frontend expected format
    return {
        "risk_free_rate": 0.045, # Fixed for now or fetch
        "senior_debt_rate": conditions.senior_rate,
        "mezzanine_debt_rate": conditions.mezzanine_rate,
        "preferred_equity_rate": 0.15 # Placeholder
    }

@router.get("/market-data/multiples/leverage")
async def get_leverage_multiples(sector: str = "Technology"):
    """Get sector-specific leverage multiples."""
    return market_aware_service.get_leverage_multiples(sector)

@router.get("/market-data/scenarios")
async def get_market_scenarios():
    """Get market scenarios for sensitivity analysis."""
    return market_aware_service.get_market_scenarios()

@router.get("/advisory/structure")
async def get_debt_structure_advice(sector: str, ebitda: float):
    """Get AI-recommended debt structure."""
    return market_aware_service.get_debt_structure_advice(sector, ebitda)

@router.get("/transactions/recent")
async def get_recent_transactions(sector: str = None):
    """Get recent M&A transactions."""
    return transaction_radar_service.get_recent_transactions(sector)

@router.get("/transactions/alerts")
async def get_market_alerts():
    """Get market alerts and news."""
    return transaction_radar_service.get_deal_alerts()

@router.post("/refinancing/analyze")
async def analyze_refinancing(request: RefinancingAnalysisRequest):
    """Analyze debt refinancing opportunity."""
    return refinancing_service.analyze_refinancing(request)

class SensitivityRequest(BaseModel):
    lbo_input: LBOInput
    row_config: Dict[str, Any]
    col_config: Dict[str, Any]
    output_metric: str = "irr"

@router.post("/sensitivity")
async def run_sensitivity_analysis(
    request: Request,
    payload: SensitivityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run a 2D sensitivity analysis on the LBO model.
    """
    try:
        logger = AuditLogger(db)
        logger.log(
            action_type="ANALYTICS_SENSITIVITY",
            user_id=current_user.id,
            resource_type="analytics",
            details={"metric": payload.output_metric},
            ip_address=request.client.host
        )
        
        return sensitivity_service.run_sensitivity_table(
            payload.lbo_input,
            payload.row_config,
            payload.col_config,
            payload.output_metric
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.calculations.fund_models import FundModel, FundStrategy, FundReturns
from backend.services.analytics.fund_simulator_service import LBOFundSimulator

fund_simulator = LBOFundSimulator()

class FundSimulationRequest(BaseModel):
    fund: FundModel
    strategy: FundStrategy

@router.post("/fund-simulation", response_model=FundReturns)
async def run_fund_simulation(
    request: Request,
    payload: FundSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate an LBO fund's performance based on fund parameters and investment strategy.
    """
    try:
        logger = AuditLogger(db)
        logger.log(
            action_type="ANALYTICS_FUND_SIMULATION",
            user_id=current_user.id,
            resource_type="analytics",
            details={"fund_name": payload.fund.name},
            ip_address=request.client.host
        )
        
        return fund_simulator.simulate_fund(payload.fund, payload.strategy)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.services.analytics.market_intelligence_service import market_intelligence, SectorSignal, DistressedOpportunity

@router.get("/market-cycles", response_model=List[SectorSignal])
async def get_market_cycles(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze market cycles and return sector timing signals.
    """
    try:
        logger = AuditLogger(db)
        logger.log(
            action_type="ANALYTICS_MARKET_CYCLES",
            user_id=current_user.id,
            resource_type="analytics",
            ip_address=request.client.host
        )
        return await market_intelligence.analyze_market_cycles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/distressed-opportunities", response_model=List[DistressedOpportunity])
async def get_distressed_opportunities(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Screen for distressed investment opportunities.
    """
    try:
        logger = AuditLogger(db)
        logger.log(
            action_type="ANALYTICS_DISTRESSED_SCREEN",
            user_id=current_user.id,
            resource_type="analytics",
            ip_address=request.client.host
        )
        return await market_intelligence.screen_distressed_opportunities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.services.analytics.backtesting_service import BacktestingService

class BacktestRequest(BaseModel):
    sector: str
    years: int = 5

@router.post("/backtest")
async def run_backtest(
    request: Request,
    payload: BacktestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run a backtest comparing valuation model outputs against historical transaction data.
    """
    try:
        logger = AuditLogger(db)
        logger.log(
            action_type="ANALYTICS_BACKTEST",
            user_id=current_user.id,
            resource_type="analytics",
            details={"sector": payload.sector},
            ip_address=request.client.host
        )
        
        service = BacktestingService(db)
        return service.run_backtest(payload.sector, payload.years)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
