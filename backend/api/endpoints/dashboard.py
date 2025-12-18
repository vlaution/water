from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

from backend.database.models import get_db, ValuationRun, User
from backend.auth.dependencies import get_current_user
from backend.services.dashboard_service import DashboardService
from backend.services.ai_report_service import AIReportService
from backend.utils.limiter import limiter
from pydantic import BaseModel

router = APIRouter()

class AISummaryResponse(BaseModel):
    summary: str

class DashboardConfig(BaseModel):
    layout: Dict[str, Any]
    widgets: List[str]

@router.get("/api/dashboard/config")
async def get_dashboard_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock config for now, or fetch from DB if UserPreferences model supports it
    # We'll return a default config
    return {
        "layout": {
            "visible_components": ["overview", "portfolio", "executive", "finance", "strategy", "investor", "benchmarking"]
        },
        "widgets": ["ai_insights", "market_ticker"]
    }

@router.post("/api/dashboard/config")
async def save_dashboard_config(
    config: DashboardConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # In a real app, save to UserPreferences table
    # For now, just echo back to simulate success
    return config

@router.get("/api/dashboard/insights")
@limiter.limit("10/minute")
async def get_dashboard_insights(
    request: Request,
    refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent runs for context
    runs = db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).limit(5).all()
    run_summaries = []
    for r in runs:
        try:
            res = json.loads(r.results)
            run_summaries.append({
                "company": r.company_name,
                "ev": res.get("enterprise_value"),
                "method": r.mode
            })
        except:
            continue
            
    service = AIReportService()
    insights = await service.generate_dashboard_insights(run_summaries, bypass_cache=refresh)
    return {"insights": insights}

@router.get("/api/analytics/insights/{run_id}")
async def get_detailed_insights(
    run_id: str,
    request: Request,
    refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    try:
        results = json.loads(run.results)
        
        # Check if insights already exist in results and we're not refreshing
        if not refresh and "ai_insights" in results:
            return results["ai_insights"]
            
        service = AIReportService()
        insights = await service.generate_detailed_insights(results, run.company_name, bypass_cache=refresh)
        
        # Save to DB
        results["ai_insights"] = insights
        run.results = json.dumps(results)
        db.commit()
        
        return insights
    except Exception as e:
        print(f"Error generating/saving insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")

@router.post("/api/ai/suggestions")
async def get_ai_suggestions(
    request: Request,
    body: Dict[str, Any],
    refresh: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates smart suggestions for valuation assumptions using NVIDIA AI.
    """
    try:
        service = AIReportService()
        suggestions = await service.generate_suggestions(
            body.get("company_data"),
            body.get("current_assumptions"),
            body.get("context"),
            bypass_cache=refresh
        )
        return {"suggestions": suggestions}
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")

@router.post("/api/reports/ai-summary/{run_id}", response_model=AISummaryResponse)
@limiter.limit("5/minute")
async def generate_ai_summary(
    run_id: str, 
    request: Request,
    refresh: bool = False,
    db: Session = Depends(get_db)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        service = AIReportService()
        summary = await service.generate_executive_summary(results, run.company_name, bypass_cache=refresh)
        return AISummaryResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/feedback")
async def collect_feedback(
    request: Request,
    body: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Collects user feedback on AI suggestions.
    """
    print(f"User Feedback: {body}")
    return {"status": "received"}

# --- New Dashboard View Endpoints ---

@router.get("/api/dashboard/overview/{run_id}")
async def get_dashboard_overview(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        # Extract key overview metrics matches OverviewView interface
        return {
            "company_name": run.company_name,
            "valuation_summary": {
                "enterprise_value": results.get("enterprise_value", 0),
                "equity_value": results.get("equity_value", 0),
            },
            "credibility_score": results.get("confidence_score", {"score": 0, "rating": "N/A"}),
            "method_breakdown": results.get("methods", []),
            "scenarios": results.get("scenarios", []),
            "forecast": results.get("dcf_details", {}), # forecast typically maps to dcf_details in this view
            "terminal_value_split": results.get("terminal_value_split", {"terminal_value": 0, "explicit_period": 0}),
            "risks": results.get("risks", []),
            "input_summary": results.get("input_summary", {}),
            "created_at": run.created_at.isoformat()
        }
    except Exception as e:
        print(f"Error fetching overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch overview data")

@router.get("/api/dashboard/finance/{run_id}")
async def get_finance_view(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        return {
            "dcf_details": results.get("dcf_details"),
            "lbo_details": results.get("lbo_details"),
            "financials": results.get("financials", {}), # If preserved from input
            "wacc": results.get("wacc")
        }
    except Exception as e:
        print(f"Error fetching finance view: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch finance data")

@router.get("/api/dashboard/strategy/{run_id}")
async def get_strategy_view(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        return {
            "strategic_alerts": results.get("strategic_alerts", []),
            "sensitivity": results.get("sensitivity"),
            "scenarios": results.get("scenarios", []),
            "swot": results.get("swot", {}) # Logic to generate or retrieve SWOT
        }
    except Exception as e:
        print(f"Error fetching strategy view: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch strategy data")

@router.get("/api/dashboard/investor/{run_id}")
async def get_investor_view(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        lbo = results.get("lbo_details", {})
        return {
            "returns_analysis": lbo.get("returns_analysis"),
            "cap_table": results.get("cap_table", {}), 
            "shareholder_value": results.get("equity_value"),
            "irr": lbo.get("returns_analysis", {}).get("irr")
        }
    except Exception as e:
        print(f"Error fetching investor view: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch investor data")

@router.get("/api/dashboard/executive")
async def get_executive_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Aggregate view of latest runs
    try:
        recent_runs = db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).limit(5).all()
        aggregated_data = []
        
        for r in recent_runs:
            try:
                res = json.loads(r.results)
                aggregated_data.append({
                    "id": r.id,
                    "company": r.company_name,
                    "ev": res.get("enterprise_value"),
                    "date": r.created_at.isoformat()
                })
            except:
                continue
                
        return {
            "recent_valuations": aggregated_data,
            "total_runs": db.query(ValuationRun).count(),
            "latest_update": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching executive view: {e}")
        # Return empty structure rather than 500
        return {"recent_valuations": [], "total_runs": 0}

