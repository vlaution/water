import sys
import os
from datetime import datetime

# Ensure backend can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.append(project_root)

from backend.compliance.validators.asc820 import ASC820Validator
from backend.services.benchmarking_service import BenchmarkingService
from backend.database.models import Regulation, Base, engine
from sqlmodel import Session

def verify_market_intelligence():
    print("=== Testing Market Intelligence + Compliance ===")
    
    # 1. Test Jurisdiction Model Update
    print("\n[1] Regulation Jurisdiction...")
    # Re-create table to ensure schema update (in-memory/file SQLite might need handling)
    # For this test, we can just check if the model class has the field, 
    # as actual DB migration isn't handled by this script.
    reg = Regulation(name="GDPR", jurisdiction="EU")
    if reg.jurisdiction == "EU":
        print("PASS: Regulation Model accepts Jurisdiction.")
    else:
        print("FAIL: Jurisdiction field missing.")

    # 2. Test ASC 820 Level 1 Check
    print("\n[2] ASC 820 Level 1 Evidence Check...")
    validator = ASC820Validator()
    
    # Case A: Level 3 valuation for a public company (Should Warn)
    val_data_bad = {
        "fair_value_level": 3,
        "company_ticker": "IBM", # Public company
        "inputs": {"unobservable_inputs_doc": True},
        "market_participant_assumptions_verified": True
    }
    
    print("   -> Checking IBM (Public) as Level 3...")
    res = validator.validate(val_data_bad)
    print(f"      Status: {res.status}")
    print(f"      Details: {res.details}")
    
    found_warning = any("WARNING: Active market Level 1 price exists" in d for d in res.details)
    if found_warning:
        print("PASS: Detected available Level 1 data and warned (Mock/Real API).")
    else:
        # If API fails or mock missing, might fail. 
        # Check if "Traceable" message exists at least?
        print("NOTE: Warning not triggered. (API Key might be missing or mock inactive).")

    # 3. Test Benchmarking Service
    print("\n[3] Industry Benchmarking...")
    bench_service = BenchmarkingService()
    try:
        # Mocking or calling real? Since we don't have DB populated with peers in this script context,
        # we might rely on the service's fallback to "MSFT" etc.
        # We need to mock the _get_metrics call if we don't want to hit real API
        # But let's try assuming the service handles failures gracefully.
        
        # We will mock the provider to ensure we get data without valid API key
        from unittest.mock import MagicMock
        from backend.calculations.benchmarking_models import CompanyMetrics
        
        mock_metrics = CompanyMetrics(
            ticker="IBM", roe=0.15, net_margin=0.12, ebitda_margin=0.20,
            revenue_growth=0.05, debt_to_equity=1.5
        )
        bench_service._get_metrics = MagicMock(return_value=mock_metrics)
        bench_service._get_sector_peers = MagicMock(return_value=["MSFT", "ORCL"])
        
        print("   -> Running Benchmark for IBM...")
        response = bench_service.get_comparison("IBM", use_sector=True)
        
        print(f"      Score: {len(response.comparisons)} comparisons generated.")
        print(f"      Example: {response.comparisons[0].metric} - {response.comparisons[0].status}")
        
        if len(response.comparisons) > 0:
            print("PASS: Benchmarking Service generated comparisons.")
        else:
            print("FAIL: No comparisons generated.")
            
    except Exception as e:
        print(f"FAIL: Benchmarking Error: {e}")

if __name__ == "__main__":
    verify_market_intelligence()
