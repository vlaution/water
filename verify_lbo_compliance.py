
import sys
import os
from datetime import datetime

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.compliance.validators.lending import LendingComplianceValidator
from backend.compliance.framework import ComplianceFramework

def verify_lbo_compliance():
    print("=== Testing LBO + Compliance ===")
    
    validator = LendingComplianceValidator()
    
    # CASE 1: High Leverage, Safe Covenant
    print("\n[1] Testing High Leverage Scenario...")
    data_high_lev = {
        "methodology": "LBO",
        "inputs": {"total_debt": 650.0, "ebitda": 100.0},
        "results": {"interest_expense": 20.0}, # Coverage = 5x
        "financing_terms_text": "Senior Debt at L+400, Mezzanine at 12% PIK."
    }
    res = validator.validate(data_high_lev)
    print(f"    Status: {res.status}")
    print(f"    Details: {res.details}")
    
    if "High Leverage Detected" in str(res.details) and res.status == "at_risk":
        print("PASS: Correctly flagged leverage > 6.0x.")
    else:
        print("FAIL: Failed to flag high leverage.")
        
    # CASE 2: Covenant Breach
    print("\n[2] Testing Covenant Breach Scenario...")
    data_breach = {
        "methodology": "LBO",
        "inputs": {"total_debt": 400.0, "ebitda": 100.0}, # Leverage 4x (Safe)
        "results": {"interest_expense": 60.0}, # Coverage = 1.66x (FAIL < 2.0x)
        "financing_terms_text": "Standard terms."
    }
    res = validator.validate(data_breach)
    print(f"    Status: {res.status}")
    print(f"    Details: {res.details}")
    
    if "CRITICAL: Interest Coverage" in str(res.details) and res.status == "fail":
        print("PASS: Correctly flagged covenant breach.")
    else:
        print("FAIL: Failed to flag covenant breach.")

    # CASE 3: Safe Deal
    print("\n[3] Testing Safe Scenario...")
    data_safe = {
        "methodology": "LBO",
        "inputs": {"total_debt": 300.0, "ebitda": 100.0}, # 3x
        "results": {"interest_expense": 25.0}, # 4x
        "financing_terms_text": "Detailed financing terms disclosed..."
    }
    res = validator.validate(data_safe)
    print(f"    Status: {res.status}")
    
    if res.status == "pass":
        print("PASS: Safe deal passed.")
    else:
        print("FAIL: Safe deal flagged incorrectly.")

    # CASE 4: Framework Integration
    print("\n[4] Framework Integration Check...")
    fw = ComplianceFramework()
    # Mocking that framework includes 'lending_covenants'
    if "lending_covenants" in fw.validators:
        print("PASS: Validator registered in framework.")
    else:
        print("FAIL: Validator not found in framework registry.")

if __name__ == "__main__":
    verify_lbo_compliance()
