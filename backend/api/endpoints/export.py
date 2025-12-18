from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from io import BytesIO
import json

from backend.database.models import get_db, ValuationRun
from backend.utils.excel_export import create_valuation_excel
from backend.reporting.pdf_generator import PDFGenerator
from backend.reporting.word_generator import WordGenerator
from backend.reporting.ppt_generator import PPTGenerator
from backend.services.report_generator_service import ReportGeneratorService

router = APIRouter()

@router.get("/export/{run_id}")
async def export_run_to_excel(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Prepare data for Excel export
    run_data = {
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": run.input_data,
        "results": run.results
    }
    
    # Generate Excel file
    excel_file = create_valuation_excel(run_data)
    
    filename = f"valuation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf/{run_id}")
async def export_run_to_pdf(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PDFGenerator()
    pdf_file = generator.generate_executive_summary(results, run_id)
    
    filename = f"Executive_Summary_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_file),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/word/{run_id}")
async def export_run_to_word(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = WordGenerator()
    word_file = generator.generate_analyst_report(results, run_id)
    
    filename = f"Analyst_Report_{run.company_name.replace(' ', '_')}_{run_id[:8]}.docx"
    
    return StreamingResponse(
        BytesIO(word_file),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/ppt/{run_id}")
async def export_run_to_ppt(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PPTGenerator()
    ppt_file = generator.generate_presentation(results, run_id)
    
    filename = f"Valuation_Presentation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pptx"
    
    return StreamingResponse(
        BytesIO(ppt_file),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/api/export/report/{run_id}", response_class=HTMLResponse)
async def export_report(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    try:
        run_data = {
            "results": json.loads(run.results),
            "input_data": json.loads(run.input_data)
        }
        
        service = ReportGeneratorService()
        html_content = await run_in_threadpool(service.generate_report, run_data, run.company_name)
        
        return html_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
