from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.services.ai.suggestion_service import SuggestionService

router = APIRouter()
suggestion_service = SuggestionService()

class SuggestionRequest(BaseModel):
    company_data: Dict[str, Any]
    current_assumptions: Dict[str, float]
    context: Dict[str, Any]

class SuggestionResponse(BaseModel):
    suggestions: Dict[str, Any]
    context: Dict[str, Any]

@router.post("/suggestions", response_model=SuggestionResponse)
async def get_suggestions(request: SuggestionRequest):
    """
    Generates smart valuation suggestions based on company data and context.
    """
    try:
        result = suggestion_service.generate_suggestions(
            request.company_data,
            request.current_assumptions,
            request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
