from fastapi import APIRouter, Depends, HTTPException
from backend.calculations.models import ValuationInput
from backend.services.validation.anomaly_detection import AnomalyDetectionService, ValidationAnalysisResponse
from backend.utils.limiter import limiter
from fastapi import Request

router = APIRouter()

@router.post("/api/validation/analyze", response_model=ValidationAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_valuation_assumptions(
    request: Request,
    input_data: ValuationInput,
    ticker: str = None,
    service: AnomalyDetectionService = Depends(AnomalyDetectionService)
):
    try:
        return service.validate_assumptions(input_data, ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
