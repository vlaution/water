from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from backend.services.financial_data.factory import FinancialDataFactory
from backend.services.wacc.service import WaccCalculatorService
from backend.services.benchmarking_service import BenchmarkingService
from backend.services.peer_finding_service import PeerFindingService
from backend.calculations.benchmarking_models import BenchmarkResponse
from backend.services.analytics.debt_market_service import debt_market_service
from backend.services.analytics.market_aware_service import market_aware_service
from backend.services.analytics.transaction_radar_service import transaction_radar_service
from backend.services.analytics.refinancing_service import refinancing_service, RefinancingAnalysisRequest
from backend.services.analytics.market_intelligence_service import market_intelligence, SectorSignal, DistressedOpportunity
from backend.database.models import User, get_db
from backend.auth.dependencies import get_current_user
from sqlalchemy.orm import Session
from backend.services.audit_service import AuditLogger
from backend.utils.limiter import limiter

router = APIRouter()

class BenchmarkRequest(BaseModel):
    ticker: str
    peer_tickers: Optional[List[str]] = None
    use_sector_average: bool = False

@router.get("/api/financials/{ticker}")
@limiter.limit("5/minute")
async def get_financials(ticker: str, request: Request):
    try:
        provider = FinancialDataFactory.get_provider()
        data = provider.get_financials(ticker)
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/market-data/{ticker}")
@limiter.limit("10/minute")
async def get_market_data(
    ticker: str, 
    request: Request,
    service: WaccCalculatorService = Depends(WaccCalculatorService)
):
    try:
        data = service.get_market_data(ticker)
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/benchmark", response_model=BenchmarkResponse)
@limiter.limit("5/minute")
async def get_benchmark_data(
    request: Request,
    payload: BenchmarkRequest,
    service: BenchmarkingService = Depends(BenchmarkingService)
):
    try:
        return service.get_comparison(
            target_ticker=payload.ticker,
            peer_tickers=payload.peer_tickers,
            use_sector=payload.use_sector_average
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/peers/{ticker}")
async def get_peers(ticker: str, sector: Optional[str] = None):
    try:
        # 1. Find Peers
        peer_service = PeerFindingService()
        peers = peer_service.find_peers(ticker, sector)
        
        # 2. Get Multiples for each peer
        results = []
        
        for peer in peers:
            metrics = peer_service.get_company_metrics(peer)
            if metrics:
                # Calculate multiples from seed data
                ev = metrics["market_cap"] # Proxy for EV in seed data
                rev = metrics["revenue"]
                ebitda = metrics["ebitda"]
                
                results.append({
                    "ticker": peer,
                    "ev_revenue": ev / rev if rev else 0,
                    "ev_ebitda": ev / ebitda if ebitda else 0,
                    "market_cap": metrics["market_cap"]
                })
                
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Migrated from analytics_routes.py ---

@router.get("/api/analytics/debt-market")
async def get_debt_market_conditions():
    """Get current debt market rates and covenants."""
    return debt_market_service.get_current_conditions()

@router.get("/api/analytics/debt-market/history")
async def get_debt_market_history():
    """Get historical debt rate trends."""
    return debt_market_service.get_historical_trends()

@router.get("/api/analytics/market-data/rates")
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

@router.get("/api/analytics/market-data/multiples/leverage")
async def get_leverage_multiples(sector: str = "Technology"):
    """Get sector-specific leverage multiples."""
    return market_aware_service.get_leverage_multiples(sector)

@router.get("/api/analytics/market-data/scenarios")
async def get_market_scenarios():
    """Get market scenarios for sensitivity analysis."""
    return market_aware_service.get_market_scenarios()

@router.get("/api/analytics/advisory/structure")
async def get_debt_structure_advice(sector: str, ebitda: float):
    """Get AI-recommended debt structure."""
    return market_aware_service.get_debt_structure_advice(sector, ebitda)

@router.get("/api/analytics/transactions/recent")
async def get_recent_transactions(sector: str = None):
    """Get recent M&A transactions."""
    return transaction_radar_service.get_recent_transactions(sector)

@router.get("/api/analytics/transactions/alerts")
async def get_market_alerts():
    """Get market alerts and news."""
    return transaction_radar_service.get_deal_alerts()

@router.post("/api/analytics/refinancing/analyze")
async def analyze_refinancing(request: RefinancingAnalysisRequest):
    """Analyze debt refinancing opportunity."""
    return refinancing_service.analyze_refinancing(request)

@router.get("/api/analytics/market-cycles", response_model=List[SectorSignal])
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

@router.get("/api/analytics/distressed-opportunities", response_model=List[DistressedOpportunity])
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
