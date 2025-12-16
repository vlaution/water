
    def _inject_disclaimers(self, content: ReportContent, valuation_id: str):
        """
        Injects regulatory disclaimers into the report content.
        In a real scenario, this would check active regulations via RegulatoryService.
        """
        # Mock fetching active regulations
        active_regs = ["ASC 820", "SOX 404"]
        
        disclaimer_text = "REGULATORY DISCLAIMER:\n"
        if "ASC 820" in active_regs:
            disclaimer_text += "This valuation is prepared in accordance with ASC 820 standards for Fair Value Measurement.\n"
        if "SOX 404" in active_regs:
            disclaimer_text += "Internal controls have been assessed in compliance with Sarbanes-Oxley Section 404.\n"
            
        disclaimer_text += "CONFIDENTIAL: This document is for the exclusive use of the named recipient."
        
        # Add to footer or a specific Disclaimer Section
        # For this architecture, we add a Disclaimer Section
        section = ReportSection(
            id="regulatory_disclaimer",
            title="Legal & Regulatory Disclaimers",
            data={"text": disclaimer_text},
            content_type="text_only",
            order=999 # Very last
        )
        content.add_section(section)

    def _append_compliance_appendix(self, content: ReportContent, context: ReportContext):
        """
        Appends the full suite of compliance templates.
        """
        # 1. Appendix Cover
        t = self.registry.get_template("compliance_appendix")
        content.add_section(t.render(context))
        
        # 2. Methodology Memo
        t = self.registry.get_template("methodology_memo")
        content.add_section(t.render(context))
        
        # 3. Compliance Report (Audit Findings)
        t = self.registry.get_template("compliance_report")
        content.add_section(t.render(context))
        
        # 4. Assumption Backup
        t = self.registry.get_template("assumption_backup")
        content.add_section(t.render(context))
        
        # 5. Change Log
        # We need to fetch the log first and share it to context
        # In a real app, this data fetching would happen in the Pipeline phase
        from backend.models.audit import AuditLog
        # Mocking data for now as we don't have easy DB access inside this method without refactoring
        # But ReportContext.shared_data is designed for this.
        # context.share_data("change_log", ...) 
        
        t = self.registry.get_template("change_control_log")
        content.add_section(t.render(context))
        
        # 6. Sign-off
        t = self.registry.get_template("sign_off_sheet")
        content.add_section(t.render(context))
