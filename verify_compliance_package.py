import sys
import os
from datetime import datetime

# Ensure backend modules can be imported
sys.path.append(os.getcwd())

from backend.reports.registry import ReportTemplateRegistry, ReportContext
from backend.models.compliance import ComplianceAudit, ComplianceResult, RemediationStep

def verify_package():
    print("=== Testing Compliance Package Templates ===")
    
    registry = ReportTemplateRegistry()
    context = ReportContext(
        data={
            "inputs": {"growth_rate": 0.05, "discount_rate": 0.10},
            "methodology": "DCF"
        },
        global_settings={}
    )
    
    # Mock Shared State for Compliance Report
    # Creating a fake audit result to populate the template
    fake_audit = ComplianceAudit(
        valuation_id="test",
        timestamp=datetime.now(),
        overall_risk_score=7.71,
        compliance_status="non_compliant",
        results={
            "asc_820": ComplianceResult(
                validator_name="ASC 820", 
                status="fail", 
                risk_score=7.71, 
                details=["Missing Level 3 Documentation"],
                weight=2.0
            )
        },
        remediation_plan=[]
    )
    context.share_data("compliance_audit", fake_audit)

    # 1. Test Compliance Report Template
    print("\n[1] Generating Compliance Report...")
    tpl_report = registry.get_template("compliance_report")
    sec_report = tpl_report.render(context)
    print(sec_report.data['text'][:100] + "...")
    if "COMPLIANCE AUDIT REPORT" in sec_report.data['text'] and "ASC 820: FAIL" in sec_report.data['text']:
        print("PASS: Compliance Report generated correctly.")
    else:
        print("FAIL: Compliance Report content mismatch.")

    # 2. Test Assumption Backup Template
    print("\n[2] Generating Assumption Backup...")
    tpl_backup = registry.get_template("assumption_backup")
    sec_backup = tpl_backup.render(context)
    print(sec_backup.data['text'][:100] + "...")
    if "ASSUMPTION BACKUP SCHEDULE" in sec_backup.data['text'] and "growth_rate" in sec_backup.data['text']:
        print("PASS: Assumption Backup generated correctly.")
    else:
        print("FAIL: Backup content mismatch.")

if __name__ == "__main__":
    verify_package()
