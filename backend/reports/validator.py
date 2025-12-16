from typing import List, Dict, Any
from backend.reports.content import ReportContent

class ReportQualityValidator:
    """
    Automated checks for report integrity before generation.
    """
    
    def validate(self, content: ReportContent) -> List[str]:
        """
        Runs a suite of checks. Returns a list of warnings/errors.
        """
        issues = []
        
        # 1. Check for Sections
        if not content.sections:
            issues.append("Report has no sections.")
            
        # 2. Check for Content
        for section in content.sections:
            if not section.data:
                issues.append(f"Section '{section.title}' has no data.")
            if not section.title:
                issues.append(f"Section {section.id} missing title.")

        # 3. Check Branding
        # Simplified: Check if metadata implies branding is active
        # branding_active = content.metadata.get("branding", False)
        # if branding_active and not content.metadata.get("logo_url"):
        #     issues.append("Branding enabled but no logo found.")

        # 4. Check Data Freshness (Mock)
        # In real world, check 'valuation_date' vs today
        
        return issues
