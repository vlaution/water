from typing import Dict, Any
from backend.reports.registry import ReportTemplate, ReportContext
from backend.reports.content import ReportSection

class MethodologyMemoTemplate(ReportTemplate):
    """
    Generates a technical memo detailing the valuation methodology.
    Critical for audit defense.
    """
    def render(self, context: ReportContext) -> ReportSection:
        methodology = context.data.get("methodology", "DCF")
        inputs = context.data.get("inputs", {})
        
        # In a real app, this would be much more detailed text generation
        memo_text = f"""
        METHODOLOGY MEMORANDUM
        
        1. Valuation Approach: {methodology}
        The primary valuation approach used is the {methodology} method. This was selected based on the nature of the asset and availability of observable market data.
        
        2. Key Assumptions:
        - Growth Rate: {inputs.get('growth_rate', 'N/A')}
        - WACC: {context.data.get('outputs', {}).get('wacc', 'N/A')}
        
        3. Compliance Statement:
        This valuation has been performed in accordance with ASC 820 standards.
        """
        
        return ReportSection(
            id="methodology_memo",
            title="Methodology & Compliance Memo",
            data={"text": memo_text},
            content_type="text_only",
            order=99
        )

class ComplianceReportTemplate(ReportTemplate):
    """
    Renders the results of the Compliance Framework Audit.
    """
    def render(self, context: ReportContext) -> ReportSection:
        # Check if audit results exist in context (passed from Service)
        audit_results = context.get_shared_data("compliance_audit")
        
        if not audit_results:
            text = "Compliance Audit was not run for this report."
        else:
            text = f"COMPLIANCE AUDIT REPORT\n"
            text += f"Status: {audit_results.compliance_status.upper()}\n"
            text += f"Risk Score: {audit_results.overall_risk_score}\n\n"
            text += "DETAILED FINDINGS:\n"
            
            for validator, res in audit_results.results.items():
                text += f"- {res.validator_name}: {res.status.upper()} (Score: {res.risk_score})\n"
                for detail in res.details:
                    text += f"  * {detail}\n"
        
        return ReportSection(
            id="compliance_report",
            title="Regulatory Compliance Report",
            data={"text": text},
            content_type="text_only",
            order=100
        )

class AssumptionBackupTemplate(ReportTemplate):
    """
    Lists all key assumptions and their sources/justifications.
    """
    def render(self, context: ReportContext) -> ReportSection:
        inputs = context.data.get("inputs", {})
        text = "ASSUMPTION BACKUP SCHEDULE\n\n"
        text += f"{'Assumption':<30} | {'Value':<15} | {'Source/Justification'}\n"
        text += "-"*80 + "\n"
        
        # Mock logic to extract sources if they existed in the input dict
        # In a real app, inputs would be objects with {value, source}
        for k, v in inputs.items():
            source = "Client Provided" # Placeholder
            text += f"{k:<30} | {str(v):<15} | {source}\n"
            
        return ReportSection(
            id="assumption_backup",
            title="Assumption Sources & backup",
            data={"text": text},
            content_type="text_only",
            order=101
        )

class ChangeControlTemplate(ReportTemplate):
    """
    Renders the Immutable Audit Log as a Change Control Schedule.
    """
    def render(self, context: ReportContext) -> ReportSection:
        # Get history from shared data
        history = context.get_shared_data("change_log") or []
        
        text = "CHANGE CONTROL LOG (IMMUTABLE LEDGER)\n\n"
        text += f"{'Result ID':<10} | {'Timestamp':<20} | {'User':<15} | {'Action':<20} | {'Hash (Partial)'}\n"
        text += "-"*100 + "\n"
        
        for record in history:
            # Handle potential missing fields if record is dict or obj
            # Assuming SQLModel object
            rid = str(record.id) if record.id else "N/A"
            ts = record.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            usr = record.user_id
            act = record.action_type
            hsh = record.hash[:10] + "..." if record.hash else "PENDING"
            
            text += f"{rid:<10} | {ts:<20} | {usr:<15} | {act:<20} | {hsh}\n"
            
        return ReportSection(
            id="change_control_log",
            title="Change Control Log",
            data={"text": text},
            content_type="text_only", # In real app, this might be a table datastructure
            order=102
        )

class SignOffTemplate(ReportTemplate):
    """
    Renders signature blocks for required approvers.
    """
    def render(self, context: ReportContext) -> ReportSection:
        text = "APPROVALS & SIGN-OFFS\n\n"
        
        roles = ["VALUATION ANALYST", "COMPLIANCE OFFICER", "HEAD OF PORTFOLIO"]
        
        for role in roles:
            text += f"{role}:\n"
            text += "_" * 40 + "\n"
            text += "Signature / Date\n\n"
            
        return ReportSection(
            id="sign_off_sheet",
            title="Regulatory Sign-off Sheet",
            data={"text": text},
            content_type="text_only",
            order=103
        )

class ComplianceAppendixTemplate(ReportTemplate):
    """
    Cover page for the Compliance Appendix.
    """
    def render(self, context: ReportContext) -> ReportSection:
        text = "COMPLIANCE APPENDIX\n"
        text += "=" * 50 + "\n\n"
        text += "This appendix contains critical regulatory documentation, including:\n"
        text += "1. Methodology & Compliance Memo\n"
        text += "2. Compliance Audit Findings\n"
        text += "3. Assumption Backup Schedule\n"
        text += "4. Change Control Log (Immutable Ledger)\n"
        text += "5. Official Sign-off Sheet\n\n"
        text += "Generated by: Valuation & Compliance Automation Platform\n"
        
        return ReportSection(
            id="compliance_appendix_cover",
            title="Appendix: Compliance & Regulatory",
            data={"text": text},
            content_type="text_only",
            order=98 # Before the detailed sub-sections
        )
