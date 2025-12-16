from typing import Dict, Any, List
from datetime import datetime
from backend.models.compliance import ComplianceAudit
from backend.reports.registry import ReportContext, ReportTemplateRegistry
from backend.services.immutable_audit import ImmutableAuditService
from backend.database.models import AuditLog

class CompliancePackage:
    def __init__(self):
        self.sections = []

    def add_section(self, section: Dict[str, Any]):
        self.sections.append(section)

    def to_dict(self):
        return {"sections": self.sections}

class ComplianceDocumentationEngine:
    def __init__(self, audit_service: ImmutableAuditService):
        self.audit_service = audit_service
        self.registry = ReportTemplateRegistry()

    def generate_compliance_package(self, valuation_id: str, company_name: str, audit_results: ComplianceAudit, inputs: Dict[str, Any]) -> CompliancePackage:
        """
        Generates the full comprehensive compliance documentation package.
        """
        package = CompliancePackage()
        
        # Context setup
        context = ReportContext(
            data={
                "inputs": inputs,
                "company_name": company_name,
                "company_name": company_name,
                "valuation_id": valuation_id
            },
            global_settings={}
        )
        context.share_data("compliance_audit", audit_results)

        # 1. Executive Compliance Summary
        # Using existing template if available or creating ad-hoc
        tpl_report = self.registry.get_template("compliance_report")
        if tpl_report:
            section = tpl_report.render(context)
            package.add_section(section.dict())

        # 2. Detailed Regulation Reports (Methodology Memo)
        tpl_memo = self.registry.get_template("methodology_memo")
        if tpl_memo:
            section = tpl_memo.render(context)
            package.add_section(section.dict())

        # 3. Evidence Repository (Assumption Backup + Screenshots)
        tpl_backup = self.registry.get_template("assumption_backup")
        # Fetch actual evidence from service
        # We need to init evidence service here or pass it in. 
        # For now, let's assume we can init it with session from audit_service (hacky but works for demo)
        from backend.services.evidence_service import EvidenceService
        evidence_service = EvidenceService(self.audit_service.session)
        attachments = evidence_service.get_attachments(valuation_id)
        context.share_data("evidence_attachments", attachments)
        
        if tpl_backup:
            section = tpl_backup.render(context)
            package.add_section(section.dict())

        # 4. Change Control Log (NEW)
        # We need to fetch the actual log from the immutable service
        change_log = self._fetch_change_log(valuation_id)
        context.share_data("change_log", change_log)
        
        tpl_change = self.registry.get_template("change_control_log")
        if tpl_change:
            section = tpl_change.render(context)
            package.add_section(section.dict())
        
        # 5. Sign-off Sheets
        tpl_sign = self.registry.get_template("sign_off_sheet")
        if tpl_sign:
            section = tpl_sign.render(context)
            package.add_section(section.dict())
        
        return package

    def _fetch_change_log(self, valuation_id: str) -> List[AuditLog]:
        """
        Fetches the immutable audit history for this valuation.
        """
        return self.audit_service.get_history(resource_id=valuation_id) 
