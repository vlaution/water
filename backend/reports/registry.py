from typing import Dict, Type, Any, Optional
import abc
from backend.reports.content import ReportSection

class ReportContext(abc.ABC):
    """
    Context passed to templates during rendering.
    Enables cross-referencing between sections.
    """
    def __init__(self, data: Dict[str, Any], global_settings: Dict[str, Any]):
        self.data = data
        self.settings = global_settings
        self._shared_state: Dict[str, Any] = {}

    def share_data(self, key: str, value: Any):
        """Publish data for other sections to use"""
        self._shared_state[key] = value

    def get_shared_data(self, key: str) -> Optional[Any]:
        """Retrieve data shared by other sections"""
        return self._shared_state.get(key)

class ReportTemplate(abc.ABC):
    """
    Base class for all report section templates.
    Strategies for generating specific sections.
    """
    @abc.abstractmethod
    def render(self, context: ReportContext) -> ReportSection:
        pass

# --- Concrete Templates (Stubs for Registry) ---

class ExecutiveSummaryTemplate(ReportTemplate):
    def render(self, context: ReportContext) -> ReportSection:
        # detailed logic will go here
        return ReportSection(
            id="executive_summary",
            title="Executive Summary",
            data=context.data.get("executive_summary", {}),
            order=1
        )

class DCFAnalysisTemplate(ReportTemplate):
    def render(self, context: ReportContext) -> ReportSection:
        return ReportSection(
            id="dcf_analysis",
            title="DCF Analysis",
            data=context.data.get("dcf_analysis", {}),
            order=2
        )

class LBOAnalysisTemplate(ReportTemplate):
    def render(self, context: ReportContext) -> ReportSection:
        return ReportSection(
            id="lbo_analysis",
            title="LBO Analysis",
            data=context.data.get("lbo_analysis", {}),
            order=3
        )

# --- Registry ---

class ReportTemplateRegistry:
    """
    Singleton registry for managing report templates.
    """
    _instance = None
    _templates: Dict[str, Type[ReportTemplate]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ReportTemplateRegistry, cls).__new__(cls)
            cls._instance._register_defaults()
        return cls._instance

    def _register_defaults(self):
        self.register("executive_summary", ExecutiveSummaryTemplate)
        self.register("dcf_analysis", DCFAnalysisTemplate)
        self.register("lbo_analysis", LBOAnalysisTemplate)
        
        # Compliance & Memos
        from backend.reports.templates.compliance import MethodologyMemoTemplate, ComplianceReportTemplate, AssumptionBackupTemplate, ChangeControlTemplate, SignOffTemplate, ComplianceAppendixTemplate
        self.register("methodology_memo", MethodologyMemoTemplate)
        self.register("compliance_report", ComplianceReportTemplate)
        self.register("assumption_backup", AssumptionBackupTemplate)
        self.register("change_control_log", ChangeControlTemplate)
        self.register("sign_off_sheet", SignOffTemplate)
        self.register("compliance_appendix", ComplianceAppendixTemplate)

    def register(self, name: str, template_class: Type[ReportTemplate]):
        self._templates[name] = template_class

    def get_template(self, name: str) -> ReportTemplate:
        template_class = self._templates.get(name)
        if not template_class:
            raise ValueError(f"Template '{name}' not found in registry.")
        return template_class()
