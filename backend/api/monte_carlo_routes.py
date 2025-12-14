from fastapi import APIRouter, HTTPException, Depends
from backend.calculations.models import LBOInput
from backend.services.valuation.formulas.monte_carlo_lbo import LBOMonteCarlo
from backend.auth.dependencies import get_current_user
from backend.database.models import User

router = APIRouter(prefix="/api/monte-carlo", tags=["monte-carlo"])

@router.post("/lbo")
async def run_lbo_monte_carlo(
    input_data: LBOInput,
    current_user: User = Depends(get_current_user)
):
    try:
        results = LBOMonteCarlo.simulate(input_data)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
