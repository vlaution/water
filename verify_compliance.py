import sys
import os

# Ensure backend modules can be imported
sys.path.append(os.getcwd())

from backend.compliance.framework import ComplianceFramework

def test_compliance():
    print("Initializing Compliance Framework...")
    framework = ComplianceFramework()
    
    # Test Case 1: High Risk Valuation (Missing Level, Conflict of Interest)
    bad_valuation = {
        "fair_value_level": None, # ASC 820 Fail
        "metadata": {
            "created_by": "john_doe",
            "reviewed_by": "john_doe", # SOX Fail (Segregation)
            "approved_at": None
        }
    }
    
    print("\nRunning Audit on 'Bad Valuation'...")
    audit = framework.audit_valuation("val_001", bad_valuation)
    
    print(f"Overall Risk Score: {audit.overall_risk_score} (Expected High)")
    print(f"Status: {audit.compliance_status}")
    print("Remediation Plan:")
    for step in audit.remediation_plan:
        print(f" - [{step.priority}] {step.issue}")

    # Test Case 2: Good Valuation
    good_valuation = {
        "fair_value_level": 2,
        "market_participant_assumptions_verified": True,
        "metadata": {
            "created_by": "alice",
            "reviewed_by": "bob",
            "approved_at": "2023-10-27T10:00:00"
        }
    }
    
    print("\nRunning Audit on 'Good Valuation'...")
    audit_good = framework.audit_valuation("val_002", good_valuation)
    print(f"Overall Risk Score: {audit_good.overall_risk_score} (Expected Low)")
    print(f"Status: {audit_good.compliance_status}")

    if audit.overall_risk_score > 5.0 and audit_good.overall_risk_score < 2.0:
        print("\nSUCCESS: Compliance Framework Logic Verified.")
    else:
        print("\nFAILURE: Risk scores not matching expectations.")

if __name__ == "__main__":
    test_compliance()
