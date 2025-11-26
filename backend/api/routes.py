from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from backend.parser.core import SheetParser
from backend.parser.models import WorkbookData
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput
from backend.database.models import get_db, ValuationRun
from backend.auth.dependencies import get_current_user
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from pydantic import BaseModel
from typing import Dict
import json
from io import BytesIO

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xlsm')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .xlsx and .xlsm are supported.")
    
    file_id = str(uuid.uuid4())
    file_path = os.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parser = SheetParser(file_path)
        workbook_data = parser.parse()
        workbook_data.file_id = file_id
        return workbook_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

class RunValuationRequest(BaseModel):
    mappings: Dict[str, str]

@router.post("/run/{file_id}")
async def run_valuation(
    file_id: str, 
    request: RunValuationRequest, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the uploaded file
    file_path = None
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Re-parse the file
    parser = SheetParser(file_path)
    workbook_data = parser.parse()
    workbook_data.file_id = file_id
    
    # Run valuation
    engine = ValuationEngine(workbook_data=workbook_data, mappings=request.mappings)
    results = engine.run()
    
    # Save to database with user association
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=results.get("input_summary", {}).get("company_name", "Unknown"),
        mode="upload",
        input_data=json.dumps(jsonable_encoder(results.get("input_summary", {}))),
        results=json.dumps(jsonable_encoder(results)),
        user_id=int(current_user["id"])  # Link to authenticated user
    )
    db.add(db_run)
    db.commit()
    
    # Add run_id to results
    results["run_id"] = run_id
    return results

@router.post("/calculate")
async def calculate_valuation_manual(
    input_data: ValuationInput, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    engine = ValuationEngine()
    results = engine.calculate(input_data)
    
    # Save to database
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=input_data.company_name,
        mode="manual",
        input_data=json.dumps(jsonable_encoder(input_data.dict())),
        results=json.dumps(jsonable_encoder(results)),
        user_id=int(current_user["id"])
    )
    db.add(db_run)
    db.commit()
    
    # Add run_id to results
    results["run_id"] = run_id
    return results

@router.get("/runs")
async def get_recent_runs(limit: int = 10, db: Session = Depends(get_db)):
    runs = db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).limit(limit).all()
    return [{
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "enterprise_value": json.loads(run.results).get("enterprise_value")
    } for run in runs]

@router.get("/runs/{run_id}")
async def get_run_details(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return {
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": json.loads(run.input_data),
        "results": json.loads(run.results)
    }

from fastapi.responses import StreamingResponse
from backend.utils.excel_export import create_valuation_excel
from backend.reporting.pdf_generator import PDFGenerator
from backend.reporting.word_generator import WordGenerator
from backend.reporting.ppt_generator import PPTGenerator

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
    
    # Return as downloadable file
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
