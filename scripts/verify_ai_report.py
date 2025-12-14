import sys
import os
import asyncio
import json

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.ai_report_service import AIReportService

def test_ai_report_generation():
    print("--- Testing AI Report Generation ---")
    
    # 1. Mock Valuation Results (Undervalued Scenario)
    mock_results = {
        "enterprise_value": 10000000.0, # 10M
        "dcf_details": {
            "revenue": [1000000, 1100000, 1210000, 1331000, 1464100], # 10% growth
            "ebitda": [200000, 220000, 242000, 266200, 292820] # 20% margin
        }
    }
    company_name = "TechNova Inc."
    
    # 2. Initialize Service
    service = AIReportService()
    
    # 3. Generate Summary
    summary = service.generate_executive_summary(mock_results, company_name)
    
    print("\nGenerated Summary:")
    print("-" * 40)
    print(summary)
    print("-" * 40)
    
    # 4. Verify Content
    if "TechNova Inc." in summary:
        print("\n[PASS] Company name included.")
    else:
        print("\n[FAIL] Company name missing.")
        
    if "Undervalued" in summary:
        print("[PASS] Correctly identified as Undervalued (vs simulated market cap).")
    else:
        print("[FAIL] Verdict logic might be off.")
        
    if "10.0%" in summary: # Growth rate check
        print("[PASS] Growth rate correctly calculated and included.")
    else:
        print("[FAIL] Growth rate missing or incorrect.")

if __name__ == "__main__":
    test_ai_report_generation()
