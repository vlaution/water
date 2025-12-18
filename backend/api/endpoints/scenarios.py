from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from backend.services.scenario_generator import ScenarioGeneratorService
from backend.services.monte_carlo_service import MonteCarloService
from backend.services.merger_service import MergerAnalysisService
from backend.services.auditing_service import AuditingService
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput
from backend.calculations.models import PWSARequest, PWSAResult, GenerateScenarioResponse, AuditIssue
from backend.calculations.monte_carlo_models import MonteCarloRequest, MonteCarloResult
from backend.calculations.merger_models import MergerAnalysisRequest, MergerAnalysisResult
from backend.calculations.models import LBOInput
from backend.services.valuation.formulas.monte_carlo_lbo import LBOMonteCarlo
from backend.services.analytics.sensitivity_service import sensitivity_service
from backend.services.analytics.fund_simulator_service import LBOFundSimulator
from backend.services.analytics.backtesting_service import BacktestingService
from backend.calculations.fund_models import FundModel, FundStrategy, FundReturns
from backend.database.models import User, get_db
from backend.auth.dependencies import get_current_user
from sqlalchemy.orm import Session
from backend.services.audit_service import AuditLogger
from typing import Dict, Any

fund_simulator = LBOFundSimulator()

router = APIRouter()

class GenerateScenarioRequest(BaseModel):
    base_assumptions: ValuationInput
    scenario_type: str
    intensity: float = 1.0

@router.post("/api/scenarios/generate", response_model=GenerateScenarioResponse)
async def generate_scenario(request: GenerateScenarioRequest):
    service = ScenarioGeneratorService()
    try:
        result = service.generate_scenario(
            request.base_assumptions, 
            request.scenario_type, 
            request.intensity
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/monte-carlo/simulate", response_model=MonteCarloResult)
async def run_monte_carlo_simulation(request: MonteCarloRequest):
    try:
        service = MonteCarloService()
        return service.run_simulation(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/merger/analyze", response_model=MergerAnalysisResult)
async def analyze_merger(request: MergerAnalysisRequest):
    try:
        service = MergerAnalysisService() 
        result = await service.analyze_deal(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/valuation/pwsa", response_model=PWSAResult)
async def calculate_pwsa(request: PWSARequest):
    try:
        engine = ValuationEngine(workbook_data=None, mappings=None)
        result = engine.calculate_pwsa(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/api/audit/assumptions', response_model=List[AuditIssue])
async def audit_assumptions(
    request: Request,
    input_data: ValuationInput,
    service: AuditingService = Depends(AuditingService)
):
    try:
        return await service.audit_valuation_input(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/valuation/sensitivity/{cache_key}")
async def get_precomputed_sensitivity(cache_key: str):
    """
    Get precomputed sensitivity matrix from cache
    """
    if cache_key in cache:
        return cache[cache_key]
    raise HTTPException(status_code=404, detail="Result not found in cache")

# --- Migrated from monte_carlo_routes.py ---
@router.post("/api/monte-carlo/lbo", tags=["monte-carlo"])
async def run_lbo_monte_carlo(
    input_data: LBOInput,
    current_user: User = Depends(get_current_user)
):
    try:
        results = LBOMonteCarlo.simulate(input_data)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Migrated from analytics_routes.py ---

class SensitivityRequest(BaseModel):
    lbo_input: LBOInput
    row_config: Dict[str, Any]
    col_config: Dict[str, Any]
    output_metric: str = "irr"

@router.post("/api/analytics/sensitivity")
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

class FundSimulationRequest(BaseModel):
    fund: FundModel
    strategy: FundStrategy

@router.post("/api/analytics/fund-simulation", response_model=FundReturns)
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


class BacktestRequest(BaseModel):
    sector: str
    years: int = 5

@router.post("/api/analytics/backtest")
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
