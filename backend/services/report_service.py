from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

from docx import Document
from docx.shared import Inches as DocxInches
from docx.shared import Pt as DocxPt
from docx.enum.text import WD_ALIGN_PARAGRAPH

import io
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Configure standard aesthetic - Professional Clean
sns.set_theme(style="white", font="sans-serif")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['axes.spines.top'] = False
plt.rcParams['axes.spines.right'] = False
plt.rcParams['axes.grid'] = True
plt.rcParams['grid.alpha'] = 0.3
plt.rcParams['grid.linestyle'] = '--'

# --- Configuration Models ---

class ReportConfig(BaseModel):
    sections: List[str] # e.g. ["executive_summary", "detailed_analysis", "appendices"]
    format: str # "pdf", "pptx", "docx", "excel"
    branding: bool # True = include logo/colors
    distribution: List[str] = [] # "email", "sharepoint"
    valuation_id: str
    company_name: str

# --- Pipeline Implementation ---
from backend.reports.registry import ReportTemplateRegistry, ReportContext
from backend.reports.content import ReportContent, ReportSection
from backend.reports.adapters import PDFAdapter, PPTXAdapter, ExcelAdapter
from backend.reports.narrative import AINarrativeEngine
from backend.reports.charts import SmartChartGenerator

from functools import lru_cache
from backend.reports.validator import ReportQualityValidator
from backend.compliance.framework import ComplianceFramework

class ReportService:
    def __init__(self):
        self.registry = ReportTemplateRegistry()
        self.narrative_engine = AINarrativeEngine()
        self.chart_generator = SmartChartGenerator()
        self.validator = ReportQualityValidator()
        self.compliance_framework = ComplianceFramework()

    def _inject_disclaimers(self, content: ReportContent, valuation_id: str):
        """
        Injects regulatory disclaimers into the report content.
        """
        # Mock fetching active regulations
        active_regs = ["ASC 820", "SOX 404"]
        
        disclaimer_text = "REGULATORY DISCLAIMER:\n"
        if "ASC 820" in active_regs:
            disclaimer_text += "This valuation is prepared in accordance with ASC 820 standards for Fair Value Measurement.\n"
        if "SOX 404" in active_regs:
            disclaimer_text += "Internal controls have been assessed in compliance with Sarbanes-Oxley Section 404.\n"
            
        disclaimer_text += "CONFIDENTIAL: This document is for the exclusive use of the named recipient."
        
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
        t = self.registry.get_template("change_control_log")
        content.add_section(t.render(context))
        
        # 6. Sign-off
        t = self.registry.get_template("sign_off_sheet")
        content.add_section(t.render(context))
        
    @lru_cache(maxsize=100)
    def _get_cached_section(self, template_name: str, data_hash: str, context: ReportContext) -> ReportSection:
        """
        Cache individual section generation.
        Note: Context object itself isn't hashable, so we pass a data_hash. 
        In a real implementation, we'd restructure this to be purely functional.
        For now, we just mock the caching wrapper.
        """
        template = self.registry.get_template(template_name)
        return template.render(context)
        
    def generate_report(self, config: ReportConfig, data: Dict[str, Any]) -> io.BytesIO:
        """
        Orchestrates the report generation pipeline.
        1. Create Context
        2. Build Content (via Registry)
        3. Enrich Content (AI/Charts)
        4. Render (via Adapters)
        """
        
        # 1. Context & Content Container
        context = ReportContext(data, {"branding": config.branding})
        content = ReportContent(
            company_name=config.company_name,
            valuation_date=datetime.now().strftime("%Y-%m-%d")
        )
        
        # 2. Build Sections (Strategy Pattern)
        # Map config sections to registry keys
        # For MVP, explicit mapping or same names
        section_map = {
            "Executive Summary": "executive_summary",
            "Detailed Analysis": "dcf_analysis", # Mapping "Detailed" to DCF for now
            "LBO Analysis": "lbo_analysis"
        }
        
        for ui_name in config.sections:
            registry_key = section_map.get(ui_name)
            if registry_key:
                # Caching Strategy: Hash the specific data for this section to use as cache key
                # Simple implementation: str(context.data.get(registry_key))
                data_hash = str(context.data.get(registry_key))
                
                # Retrieve from cache or generate
                # We need to bypass lru_cache for this Architecture MVP because passing 'context' object breaks hashing
                # So we call directly, but the hooks are there.
                template = self.registry.get_template(registry_key)
                section = template.render(context)
                
                # 3. Enrich Content (Narrative & Charts)
                if not section.data.get("text"):
                    section.data["summary_text"] = self.narrative_engine.generate_section_narrative(
                        registry_key, context.data.get("outputs", {}), "executive"
                    )
                
                content.add_section(section)

        # 3b. Inject Compliance Content
        if config.branding:
             self._inject_disclaimers(content, config.valuation_id)
             
        if "Compliance Appendix" in config.sections:
             self._append_compliance_appendix(content, context)

        # 4. Validate Quality
        issues = self.validator.validate(content)
        if issues:
            print(f"Report Validation Issues: {issues}")
            # In strict mode, we might raise an error. For now, log warnings.

        # 4. Render Adapter
        if config.format == "pdf":
            return PDFAdapter().render(content)
        elif config.format == "pptx":
            return PPTXAdapter().render(content)
        elif config.format == "excel":
           return ExcelAdapter().render(content)
        elif config.format == "docx":
            # Fallback to PDF for now or Implement DocxAdapter
            return PDFAdapter().render(content) 
            
        raise ValueError("Unsupported format")
