from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
from typing import List, Optional

from backend.database.models import get_db, MarketSnapshot
from backend.services.financial_data.market_data_service import market_data_service

router = APIRouter(prefix="/api/market-data/historical", tags=["Market Data Historical"])

@router.post("/snapshot")
async def create_market_snapshot(db: Session = Depends(get_db)):
    """
    Manually triggers a snapshot of current market data.
    """
    try:
        # 1. Fetch Rates
        rates = market_data_service.fetch_interest_rates()
        if not rates:
            raise HTTPException(status_code=500, detail="Failed to fetch market rates")
            
        # 2. Fetch Multiples (Mocked sectors for now)
        sectors = ["Technology", "Healthcare", "Industrials", "Consumer"]
        lev_multiples = {}
        exit_multiples = {}
        
        for s in sectors:
            lev = market_data_service.fetch_leverage_multiples(s)
            exit_m = market_data_service.fetch_exit_multiples(s)
            lev_multiples[s] = lev
            exit_multiples[s] = exit_m['ev_ebitda']
            
        # 3. Save to DB
        snapshot = MarketSnapshot(
            risk_free_rate=rates.get('risk_free_rate'),
            corporate_spread_bbb=rates.get('senior_debt_rate') - rates.get('risk_free_rate'), # Backing out spread
            high_yield_spread=rates.get('mezzanine_debt_rate') - rates.get('risk_free_rate'),
            sector_leverage_multiples=json.dumps(lev_multiples),
            sector_exit_multiples=json.dumps(exit_multiples)
        )
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        return {"status": "success", "snapshot_id": snapshot.id, "date": snapshot.date}
        
    except Exception as e:
        print(f"Error creating snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[dict])
async def get_historical_data(days: int = 30, db: Session = Depends(get_db)):
    """
    Returns historical market data for the last N days.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    snapshots = db.query(MarketSnapshot).filter(MarketSnapshot.date >= cutoff).order_by(MarketSnapshot.date.asc()).all()
    
    result = []
    for s in snapshots:
        risk_free = s.risk_free_rate if s.risk_free_rate is not None else 0.04
        bbb_spread = s.corporate_spread_bbb if s.corporate_spread_bbb is not None else 0.02
        hy_spread = s.high_yield_spread if s.high_yield_spread is not None else 0.04
        
        result.append({
            "id": s.id,
            "date": s.date,
            "rates": {
                "risk_free_rate": risk_free,
                "senior_debt_rate": risk_free + bbb_spread,
                "mezzanine_debt_rate": risk_free + hy_spread,
                "preferred_equity_rate": risk_free + hy_spread + 0.02 # Approx 200bps over HY
            },
            "multiples": json.loads(s.sector_exit_multiples) if s.sector_exit_multiples else {},
            "system_multiples": json.loads(s.sector_leverage_multiples) if s.sector_leverage_multiples else {}
        })
    return result
