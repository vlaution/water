from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from backend.database.models import get_db, ValuationRun, User
from backend.auth.dependencies import get_current_user
from backend.services.report_service import ReportService, ReportConfig
from backend.services.audit.service import audit_service
import json

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/generate")
async def generate_report(
    config: ReportConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a professional report (PDF, PPTX, DOCX) based on configuration.
    """
    # 1. Fetch Data
    valuation = db.query(ValuationRun).filter(ValuationRun.id == config.valuation_id).first()
    if not valuation:
        raise HTTPException(status_code=404, detail="Valuation run not found")
        
    try:
        inputs = json.loads(valuation.input_data)
        results = json.loads(valuation.results)
    except:
        raise HTTPException(status_code=500, detail="Corrupt valuation data")
        
    # Prepare Data Context
    data = {
        "inputs": inputs,
        "outputs": results,
        "company_name": valuation.company_name or config.company_name,
        "meta": {
            "author": current_user.full_name,
            "email": current_user.email
        }
    }
    
    # 2. Generate Report
    service = ReportService()
    try:
        file_buffer = service.generate_report(config, data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    # 3. Audit Log
    audit_service.log(
        action="REPORT_GENERATED",
        user_id=current_user.id,
        resource=f"valuation:{config.valuation_id}",
        details={"format": config.format, "sections": config.sections}
    )

    # 4. Return File
    media_types = {
        "pdf": "application/pdf",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    
    extensions = {
        "pdf": "pdf",
        "pptx": "pptx",
        "docx": "docx"
    }
    
    filename = f"{config.company_name}_Report.{extensions.get(config.format, 'bin')}"
    # Sanitize filename
    filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_')]).strip()
    
    return StreamingResponse(
        file_buffer,
        media_type=media_types.get(config.format, "application/octet-stream"),
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
