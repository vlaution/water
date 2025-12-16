from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from backend.services.financial_data.market_data_service import market_data_service

router = APIRouter(prefix="/api/market-data", tags=["Market Data"])

@router.get("/rates")
async def get_market_rates():
    """
    Get current market interest rates (Risk Free, Senior Debt, Mezzanine).
    """
    try:
        return market_data_service.fetch_interest_rates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/multiples/leverage")
async def get_leverage_multiples(sector: Optional[str] = None):
    """
    Get typical leverage multiples for a sector.
    """
    return market_data_service.fetch_leverage_multiples(sector)

@router.get("/multiples/heatmap")
async def get_multiples_heatmap():
    """
    Get leverage multiples for all sectors for the Heatmap.
    """
    return market_data_service.fetch_all_leverage_multiples()

@router.get("/multiples/exit")
async def get_exit_multiples(sector: Optional[str] = None):
    """
    Get typical exit multiples for a sector.
    """
    return market_data_service.fetch_exit_multiples(sector)

@router.get("/scenarios")
async def get_market_scenarios():
    """
    Get market data for different scenarios (Current, Stress, Bull).
    """
    from backend.services.financial_data.market_scenario_service import market_scenario_service
    return market_scenario_service.get_scenarios()
