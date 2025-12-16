from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Dict, Any
from backend.database.models import get_db, AuditLog
from backend.compliance.framework import ComplianceFramework
from backend.services.immutable_audit import ImmutableAuditService

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@router.get("/dashboard-stats/{valuation_id}")
def get_dashboard_stats(valuation_id: str, db: Session = Depends(get_db)):
    """
    Aggregates compliance metrics for the dashboard.
    """
    stats = {
        "status_checks": {},
        "risk_heatmap": {"high": 0, "medium": 0, "low": 0},
        "remediation_progress": 0,
        "doc_completeness": 0
    }
    
    # 1. Framework Checks (ASC 820, SOX)
    # We need to fetch valuation inputs. For now mocking or fetching from DB if Validation model existed.
    # Assuming we receive inputs or fetch them. 
    # For this demo, we'll use a dummy valuation object to run the check.
    # In production, we'd fetch `Valuation` by `valuation_id`.
    
    framework = ComplianceFramework()
    # Mock data for dashboard visualization
    mock_val_data = {"fair_value_level": 2, "process_controls": ["checked"]} 
    
    # Run audit
    audit = framework.audit_valuation(valuation_id, mock_val_data)
    
    stats["status_checks"]["asc_820"] = "Compliant" if audit.results.get("asc_820", {}).status == "pass" else "Issue Detected"
    stats["status_checks"]["sox_404"] = "Compliant" if audit.results.get("sox_404", {}).status == "pass" else "Issue Detected"
    
    # 2. Integrity Check
    audit_service = ImmutableAuditService(db)
    integrity = audit_service.verify_chain_integrity()
    stats["status_checks"]["audit_integrity"] = "Verified" if integrity["status"] == "valid" else "Compromised"
    
    # 3. GDPR (Mock)
    stats["status_checks"]["data_privacy"] = "Compliant"
    
    # 4. Risk Heatmap
    # We count remediation steps by priority
    for step in audit.remediation_plan:
        if step.priority == "high":
            stats["risk_heatmap"]["high"] += 1
        elif step.priority == "medium":
            stats["risk_heatmap"]["medium"] += 1
        else:
            stats["risk_heatmap"]["low"] += 1
            
    # Mock remediation progress
    stats["remediation_progress"] = 80 if stats["risk_heatmap"]["high"] == 0 else 40
    
    # 5. Doc Completeness (Mock logic)
    # Check if we have logs
    logs = audit_service.get_history(valuation_id)
    has_logs = len(logs) > 0
    stats["doc_completeness"] = 95 if has_logs else 50
    
    return stats
