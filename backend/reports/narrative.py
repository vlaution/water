from typing import Dict, Any
from backend.services.ai_report_service import AIReportService

class AINarrativeEngine:
    """
    Generates narrative text for report sections based on audience context.
    """
    
    async def generate_section_narrative(self, section_type: str, data: Dict[str, Any], audience: str = "executive") -> str:
        """
        Generates text for a section using AIReportService.
        """
        service = AIReportService()
        
        # Determine the company name if available
        company_name = data.get("company_name", "Target Company")
        
        if section_type == "executive_summary":
            return await service.generate_executive_summary(data, company_name)
        
        elif section_type == "dcf_analysis" or section_type == "lbo_analysis":
            insights = await service.generate_detailed_insights(data, company_name)
            # Combine insights into a narrative block
            text = "### Strategic Assessment\n"
            text += "\n".join([f"- {i}" for i in insights.get("strategic_assessment", [])])
            text += "\n\n### Key Risks\n"
            text += "\n".join([f"- {i}" for i in insights.get("risk_factors", [])])
            return text

        return "Narrative generation unavailable for this section."
