from typing import List, Dict, Any, Optional, Protocol
from pydantic import BaseModel
import abc

class ReportSection(BaseModel):
    """
    Represents a single section of the report (e.g., Executive Summary).
    Holds data abstractly before rendering.
    """
    id: str
    title: str
    data: Dict[str, Any]
    content_type: str = "standard" # standard, chart_only, table_only, mixed
    order: int

class ReportContent(BaseModel):
    """
    The Unified Content Model. 
    Acts as the Single Source of Truth for all formats.
    """
    company_name: str
    valuation_date: str
    sections: List[ReportSection] = []
    metadata: Dict[str, Any] = {}

    def add_section(self, section: ReportSection):
        self.sections.append(section)
        self.sections.sort(key=lambda x: x.order)

class FormatAdapter(abc.ABC):
    """
    Abstract interface for Format Adapters (PDF, PPTX, Excel).
    """
    @abc.abstractmethod
    def render(self, content: ReportContent) -> Any:
        pass
