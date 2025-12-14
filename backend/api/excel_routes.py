from fastapi import APIRouter, Depends, HTTPException, status, Header, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import hashlib
from datetime import datetime
import csv
import io
from fastapi.responses import StreamingResponse

from backend.database.models import get_db, ValuationRun, AuditLog, User
from backend.auth.dependencies import get_current_user
from backend.services.audit.service import audit_service

router = APIRouter(prefix="/api/excel", tags=["excel"])

def generate_etag(content: str) -> str:
    return hashlib.md5(content.encode()).hexdigest()

@router.get("/companies", response_model=List[str])
async def get_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of companies for Excel dropdown.
    Currently returns distinct company names from existing valuations.
    """
    companies = db.query(ValuationRun.company_name).distinct().all()
    return [c[0] for c in companies]

@router.get("/valuation/{valuation_id}/export")
async def export_valuation(
    valuation_id: str,
    response: Response,
    format: str = "json",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export valuation data for Excel.
    Returns flattened data structure with ETag for concurrency control.
    """
    valuation = db.query(ValuationRun).filter(ValuationRun.id == valuation_id).first()
    if not valuation:
        raise HTTPException(status_code=404, detail="Valuation not found")

    # Parse JSON data
    try:
        inputs = json.loads(valuation.input_data)
        results = json.loads(valuation.results)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Data corruption detected")

    # Construct export payload
    export_data = {
        "id": valuation.id,
        "company_name": valuation.company_name,
        "valuation_date": valuation.created_at.isoformat(),
        "currency": inputs.get("currency", "USD"),
        "inputs": inputs,
        "outputs": results,
        "meta": {
            "last_updated": valuation.updated_at.isoformat() if valuation.updated_at else valuation.created_at.isoformat(),
            "version": "1.0"
        },
        "validation": {
            "currency": ["USD", "EUR", "GBP", "JPY", "CAD"],
            "industry": ["Technology", "Healthcare", "Finance", "Energy", "Consumer"]
        }
    }

    # Generate ETag
    data_str = json.dumps(export_data, sort_keys=True)
    etag = generate_etag(data_str)
    
    # Set headers
    response.headers["ETag"] = etag
    
    # Audit Log
    audit_service.log(
        action="EXCEL_EXPORT",
        user_id=current_user.id,
        resource=f"valuation:{valuation_id}",
        details={"etag": etag, "format": format}
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Section", "Key", "Value"])
        
        def flatten_dict(d, parent_key='', sep='.'):
            items = []
            for k, v in d.items():
                new_key = f"{parent_key}{sep}{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key, sep=sep).items())
                elif isinstance(v, list):
                     items.append((new_key, json.dumps(v)))
                else:
                    items.append((new_key, v))
            return dict(items)

        for k, v in flatten_dict(inputs, parent_key="Input").items():
            writer.writerow(["Input", k, v])
            
        for k, v in flatten_dict(results, parent_key="Output").items():
            writer.writerow(["Output", k, v])
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=valuation_{valuation_id}.csv"}
        )

    return export_data

@router.post("/import")
async def import_valuation(
    data: dict,
    if_match: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import/Update valuation from Excel.
    Uses Optimistic Concurrency Control via If-Match header.
    """
    valuation_id = data.get("id")
    if not valuation_id:
        raise HTTPException(status_code=400, detail="Valuation ID required")

    valuation = db.query(ValuationRun).filter(ValuationRun.id == valuation_id).first()
    if not valuation:
        raise HTTPException(status_code=404, detail="Valuation not found")

    # Check ETag if provided
    if if_match:
        # Reconstruct current state to check ETag
        current_inputs = json.loads(valuation.input_data)
        current_results = json.loads(valuation.results)
        current_data = {
            "id": valuation.id,
            "company_name": valuation.company_name,
            "valuation_date": valuation.created_at.isoformat(),
            "currency": current_inputs.get("currency", "USD"),
            "inputs": current_inputs,
            "outputs": current_results,
            "meta": {
                "last_updated": valuation.updated_at.isoformat() if valuation.updated_at else valuation.created_at.isoformat(),
                "version": "1.0"
            },
            "validation": {
                "currency": ["USD", "EUR", "GBP", "JPY", "CAD"],
                "industry": ["Technology", "Healthcare", "Finance", "Energy", "Consumer"]
            }
        }
        current_etag = generate_etag(json.dumps(current_data, sort_keys=True))
        
        if current_etag != if_match.replace('"', ''): # Handle quotes in header
            raise HTTPException(
                status_code=412, 
                detail="Precondition Failed: Data has changed on server. Please refresh."
            )

    # Update Valuation
    # Note: In a real scenario, we'd likely re-run the valuation engine here 
    # based on new inputs rather than trusting 'outputs' from Excel blindly.
    # For now, we'll update inputs and assume outputs are re-calculated or passed.
    # Let's assume we update inputs and trigger a re-calc (mocked here).
    
    # Update Input Data
    valuation.input_data = json.dumps(data.get("inputs", {}))
    valuation.updated_at = datetime.utcnow()
    
    # Trigger Re-calculation
    from backend.calculations.core import ValuationEngine
    from backend.calculations.models import ValuationInput
    
    try:
        # Convert dict to pydantic model
        # Assuming input data from Excel matches strictly
        val_input = ValuationInput(**data.get("inputs", {}))
        
        # Run calculation
        engine = ValuationEngine(user_id=current_user.id)
        results = engine.calculate(val_input)
        
        # Update results in DB
        valuation.results = json.dumps(results)
        
    except Exception as e:
        print(f"Recalculation failed: {e}")
        # We allow saving inputs even if calculation fails, but warn?
        # Or should we fail the request? Failing seems safer.
        raise HTTPException(status_code=400, detail=f"Calculation failed with new inputs: {str(e)}")

    db.commit()

    # Audit Log
    audit_service.log(
        action="EXCEL_IMPORT",
        user_id=current_user.id,
        resource=f"valuation:{valuation_id}",
        details={"status": "updated"}
    )

    return {"status": "success", "message": "Valuation updated successfully"}
