from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
from fastapi import HTTPException
from backend.database.models import ValuationRun, User, AuditLog
from backend.services.immutable_audit import ImmutableAuditService
from backend.compliance.framework import ComplianceFramework

class WorkflowService:
    def __init__(self, session: Session):
        self.session = session
        self.audit_service = ImmutableAuditService(session)
        self.framework = ComplianceFramework()

    def transition_status(self, valuation_id: str, new_status: str, user_id: int):
        """
         transitions the valuation state with validation gates.
        """
        valuation = self.session.get(ValuationRun, valuation_id)
        if not valuation:
            raise HTTPException(status_code=404, detail="Valuation not found")

        current_status = valuation.status
        
        # 1. Gate: Entering 'review' requires compliance check
        if new_status == "review":
            self._enforce_compliance_gate(valuation_id)

        # 2. Gate: 'approved' requires signer to be the reviewer
        if new_status == "approved":
            if valuation.reviewer_id and valuation.reviewer_id != user_id:
                raise HTTPException(status_code=403, detail="Only assigned reviewer can approve.")
            
            # Crypto Sign-off
            self._perform_signoff(valuation, user_id)

        # Update State
        valuation.status = new_status
        self.session.add(valuation)
        self.session.commit()
        
        # Log Logic Transition (Immutable)
        # Log Logic Transition (Immutable)
        self.audit_service.log_event_cryptographic(
            user_id=user_id,
            action=f"STATUS_CHANGE_TO_{new_status.upper()}",
            resource_type="valuation_run",
            resource_id=valuation_id,
            details={"msg": f"Transitioned from {current_status} to {new_status}"}
        )
        
        return valuation

    def assign_reviewer(self, valuation_id: str, reviewer_id: int, user_id: int):
        valuation = self.session.get(ValuationRun, valuation_id)
        if not valuation:
            raise HTTPException(status_code=404, detail="Valuation not found")
            
        valuation.reviewer_id = reviewer_id
        valuation.status = "review" # Auto-move to review when assigned? Or keep separate? Let's keep separate.
        self.session.add(valuation)
        self.session.commit()
        
        self.audit_service.log_event_cryptographic(
            user_id=user_id,
            action="ASSIGN_REVIEWER",
            resource_type="valuation_run",
            resource_id=valuation_id,
            details={"reviewer_id": reviewer_id}
        )
        return valuation

    def _enforce_compliance_gate(self, valuation_id: str):
        # Mock data for check - in real app would parse 'valuation.input_data'
        audit = self.framework.audit_valuation(valuation_id, {}, None)
        if audit.overall_risk_score >= 10.0: # Threshold for BLOCKING
            # Check if critical
            # simplified logic
            raise HTTPException(status_code=400, detail="Compliance Checks Failed: Critical Risks Detected. Resolve before Review.")

    def _perform_signoff(self, valuation: ValuationRun, user_id: int):
        # generate signature payload
        payload = f"{valuation.id}:{user_id}:{datetime.utcnow()}:APPROVED"
        # In a real app, sign with user's private key. Here we hash it and link to chain.
        
        # We use the audit service to "mine" this approval block
        # We use the audit service to "mine" this approval block
        entry = self.audit_service.log_event_cryptographic(
            user_id=user_id,
            action="OFFICIAL_SIGNOFF",
            resource_type="valuation_run",
            resource_id=valuation.id,
            details={"msg": "Electronic Signature Applied"}
        )
        
        # Store the hash of that block as the signature on the valuation
        # We need to fetch it back - simplified:
        # verification would check if this hash exists in the chain
        valuation.signoff_timestamp = datetime.utcnow()
        valuation.signoff_signature = f"SIG:{entry.hash}" # Linked to the block hash
