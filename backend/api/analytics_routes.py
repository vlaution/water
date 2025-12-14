from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database.models import get_db, User
from backend.auth.dependencies import get_current_user
from backend.services.analytics.reporting_service import ReportingService
from backend.services.analytics.ai_insight_service import AIInsightService
from backend.database.models import ValuationRun
from backend.calculations.models import ValuationInput
import json

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/report/pdf/{run_id}")
async def generate_pdf_report(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates and downloads a PDF board report.
    """
    service = ReportingService(db)
    try:
        pdf_buffer = service.generate_board_report(run_id)
        
        headers = {
            'Content-Disposition': f'attachment; filename="Board_Report_{run_id}.pdf"'
        }
        
        return StreamingResponse(
            pdf_buffer, 
            media_type='application/pdf', 
            headers=headers
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/{run_id}")
async def get_ai_insights(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates AI-driven insights for a specific valuation run.
    """
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    try:
        results = json.loads(run.results)
        # Parse inputs back into Pydantic model
        inputs = ValuationInput(**json.loads(run.inputs))
        
        service = AIInsightService()
        insights = service.generate_insights(results, inputs)
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
