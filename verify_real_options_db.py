import sys
import os
import asyncio
import json
import uuid
from datetime import datetime

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.real_options_service import RealOptionsService
from backend.calculations.real_options_models import RealOptionsRequest
from backend.database.models import ValuationRun, SessionLocal, init_db

def create_dummy_run(db):
    run_id = str(uuid.uuid4())
    dummy_results = {
        "enterprise_value": 5000000.0, # 5M
        "equity_value": 4000000.0
    }
    
    run = ValuationRun(
        id=run_id,
        company_name="Test Corp",
        mode="manual",
        input_data="{}",
        results=json.dumps(dummy_results),
        created_at=datetime.utcnow()
    )
    db.add(run)
    db.commit()
    print(f"Created dummy run with ID: {run_id} and EV: 5,000,000")
    return run_id

async def test_db_integration():
    # Init DB
    init_db()
    db = SessionLocal()
    
    try:
        # 1. Create Dummy Run
        run_id = create_dummy_run(db)
        
        # 2. Call Service with run_id and NO asset_value
        service = RealOptionsService()
        req = RealOptionsRequest(
            option_type="expansion",
            strike_price=4000000, # 4M
            time_to_expiration=1,
            dcf_valuation_id=run_id
            # asset_value is MISSING, should be fetched
        )
        
        print("\n--- Testing DB Fetch ---")
        result = await service.calculate_option_value(req, db)
        
        # 3. Verify
        fetched_val = result.inputs_used['asset_value']
        print(f"Fetched Asset Value: {fetched_val}")
        
        if fetched_val == 5000000.0:
            print("SUCCESS: Correctly fetched value from DB.")
        else:
            print(f"FAILURE: Expected 5000000.0, got {fetched_val}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_db_integration())
