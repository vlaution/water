from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import shutil
import os
import uuid
import json

from backend.database.models import get_db, ValuationRun, User
from backend.auth.dependencies import get_current_user
from backend.services.audit_service import AuditService
from backend.services.auditing_service import AuditingService
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput, ValidationErrorResponse, AuditIssue
from backend.parser.core import SheetParser
from backend.services.data_import.excel_processor import ExcelProcessor
from pydantic import BaseModel

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class RunValuationRequest(BaseModel):
    mappings: Dict[str, str]

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xlsm')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .xlsx and .xlsm are supported.")
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parser = SheetParser(file_path)
        workbook_data = parser.parse()
        workbook_data.file_id = file_id
        return workbook_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

@router.post("/run/{file_id}")
async def run_valuation(
    file_id: str, 
    request: RunValuationRequest, 
    req: Request,
    current_user: User = Depends(get_current_user),
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
    
    # Process Excel Data
    processor = ExcelProcessor(workbook_data, request.mappings)
    valuation_input, errors = await run_in_threadpool(processor.process)
    
    # Check for critical errors
    critical_errors = [e for e in errors if e.severity == "error"]
    if critical_errors:
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder(ValidationErrorResponse(details=errors))
        )
    
    if not valuation_input:
         return JSONResponse(
            status_code=400,
            content=jsonable_encoder(ValidationErrorResponse(details=[
                {"field": "general", "value": None, "message": "Failed to generate valuation input", "severity": "error"}
            ]))
        )

    # Run valuation
    engine = ValuationEngine(user_id=current_user.id)
    results = await run_in_threadpool(engine.calculate, valuation_input)
    
    # Add any non-critical validation warnings to results
    results["validation_warnings"] = [e.dict() for e in errors if e.severity == "warning"]
    
    # Save to database with user association
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=results.get("input_summary", {}).get("company_name", "Unknown"),
        mode="upload",
        input_data=json.dumps(jsonable_encoder(results.get("input_summary", {}))),
        results=json.dumps(jsonable_encoder(results)),
        user_id=current_user.id 
    )
    db.add(db_run)
    db.commit()
    
    results["run_id"] = run_id
    
    # Audit Log
    try:
        audit_service = AuditService(db)
        audit_service.log_event(
            user_id=str(current_user.id),
            action="CREATE_VALUATION_UPLOAD",
            resource_type="valuation",
            resource_id=run_id,
            details={"mode": "upload", "ip": req.client.host}
        )
    except Exception as e:
        print(f"Audit log failed: {e}")

    return results

@router.post("/calculate")
async def calculate_valuation_manual(
    input_data: ValuationInput, 
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    auditing_service: AuditingService = Depends(AuditingService)
):
    # Run Audit
    audit_issues = await auditing_service.audit_valuation_input(input_data)

    engine = ValuationEngine(user_id=current_user.id)
    try:
        results = await run_in_threadpool(engine.calculate, input_data)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Calculation Engine Error: {str(e)}")
    
    results["audit_issues"] = [issue.dict() for issue in audit_issues]
    
    # Trigger Precomputation
    if "cache_key" in results:
        background_tasks.add_task(engine.precompute_sensitivities, input_data, results["cache_key"])

    # Save to database
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=input_data.company_name,
        mode="manual",
        input_data=json.dumps(jsonable_encoder(input_data.dict())),
        results=json.dumps(jsonable_encoder(results)),
        user_id=current_user.id
    )
    db.add(db_run)
    db.commit()
    
    results["run_id"] = run_id
    
    # Audit Log
    try:
        audit_service = AuditService(db)
        audit_service.log_event(
            user_id=str(current_user.id),
            action="CREATE_VALUATION_MANUAL",
            resource_type="valuation",
            resource_id=run_id,
            details={"mode": "manual", "ip": request.client.host}
        )
    except Exception as e:
        print(f"Audit log failed: {e}")

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
