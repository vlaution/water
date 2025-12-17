import sys
import os
from datetime import datetime

# Ensure backend can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
sys.path.append(project_root)

from sqlmodel import Session, create_engine, SQLModel
from backend.models.compliance import ComplianceAudit, ComplianceResult
from backend.compliance.documentation import ComplianceDocumentationEngine
from backend.services.immutable_audit import ImmutableAuditService
from backend.models.audit import AuditLog

# In-memory DB
sqlite_url = "sqlite://"
engine = create_engine(sqlite_url)

def verify_engine():
    print("=== Testing Compliance Documentation Engine ===")
    
    # 1. Setup DB & Services
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    
    audit_service = ImmutableAuditService(session)
    doc_engine = ComplianceDocumentationEngine(audit_service)
    
    # 2. Seed Data
    val_id = "val_test_123"
    
    # Audit Logs (Change History)
    print("\n[1] Seeding Audit History...")
    audit_service.log_event_cryptographic("user_A", "CREATE_VALUATION", "valuation", val_id)
    audit_service.log_event_cryptographic("user_B", "UPDATE_WACC", "valuation", val_id, {"old": 0.08, "new": 0.09})
    audit_service.log_event_cryptographic("user_A", "GENERATE_REPORT", "report", "rep_001") # diff resource
    
    # Compliance Audit Results
    audit_results = ComplianceAudit(
        valuation_id=val_id,
        timestamp=datetime.now(),
        overall_risk_score=5.0,
        compliance_status="compliant",
        results={},
        remediation_plan=[]
    )
    
    # Inputs
    inputs = {"growth_rate": 0.05, "wacc": 0.09}
    
    # 3. Generate Package
    print("\n[2] Generating Compliance Package...")
    package = doc_engine.generate_compliance_package(
        valuation_id=val_id,
        company_name="Acme Corp",
        audit_results=audit_results,
        inputs=inputs
    )
    
    # 4. Verify Sections
    print("\n[3] Verifying Sections...")
    sections = package.to_dict()["sections"]
    section_ids = [s["id"] for s in sections]
    print(f"Generated Sections: {section_ids}")
    
    # Check Required Sections
    required = ["compliance_report", "methodology_memo", "change_control_log", "sign_off_sheet"]
    missing = [req for req in required if req not in section_ids]
    
    if missing:
        print(f"FAIL: Missing sections: {missing}")
    else:
        print("PASS: All required sections present.")
        
    # 5. Verify Content
    print("\n[4] Verifying Content...")
    
    # Check Change Log Content
    log_section = next(s for s in sections if s["id"] == "change_control_log")
    text = log_section["data"]["text"]
    if "UPDATE_WACC" in text and "user_B" in text:
        print("PASS: Change Log contains correct history.")
    else:
        print("FAIL: Change Log missing expected events.")
        print("Log Text Preview:\n", text[:200])
        
    # Check Sign-off
    sign_section = next(s for s in sections if s["id"] == "sign_off_sheet")
    if "COMPLIANCE OFFICER" in sign_section["data"]["text"]:
        print("PASS: Sign-off sheet contains correct roles.")
    else:
        print("FAIL: Sign-off sheet malformed.")

if __name__ == "__main__":
    verify_engine()
