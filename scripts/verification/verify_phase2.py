import sys
import os
from datetime import datetime

# Ensure backend modules can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.append(project_root)

from backend.compliance.framework import ComplianceFramework
from backend.services.audit_service import AuditService
from backend.reports.registry import ReportTemplateRegistry, ReportContext

def verify_phase_2():
    print("=== Starting Phase 2 Verification ===")
    
    # 1. Verify Compliance Framework
    print("\n[1] Testing Compliance Framework...")
    framework = ComplianceFramework()
    val_data = {
        "fair_value_level": 3,
        "inputs": {"unobservable_inputs_doc": "Verified by 3rd party"},
        "metadata": {"created_by": "alice", "reviewed_by": "bob", "approved_at": datetime.now()}
    }
    audit = framework.audit_valuation("val_test", val_data)
    print(f"Audit Result: Status={audit.compliance_status}, Score={audit.overall_risk_score}")
    
    if audit.compliance_status != "compliant":
        print("FAILURE: Expected compliant status.")
        return

    # 2. Verify Audit Service
    print("\n[2] Testing Audit Service...")
    audit_service = AuditService() # No session, prints to console
    audit_service.log_event("user_123", "UPDATE_ASSUMPTION", "valuation", "val_test", {"old": 5, "new": 6})
    print("Audit Logged (Check Console Output)")

    # 3. Verify Methodology Template
    print("\n[3] Testing Methodology Template...")
    registry = ReportTemplateRegistry()
    template = registry.get_template("methodology_memo")
    
    context = ReportContext(
        data={"methodology": "Discounted Cash Flow", "inputs": {"growth_rate": 0.05}, "outputs": {"wacc": 0.10}},
        global_settings={}
    )
    
    section = template.render(context)
    print(f"Generated Section: {section.title}")
    print(f"Content Preview: {section.data['text'][:50]}...")
    
    if "METHODOLOGY MEMORANDUM" in section.data["text"]:
        print("\nSUCCESS: Phase 2 Vertical Verified.")
    else:
        print("\nFAILURE: Methodology Memo content incorrect.")

if __name__ == "__main__":
    verify_phase_2()
