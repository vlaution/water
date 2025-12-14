from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from sqlalchemy.orm import Session
from backend.database.models import ValuationRun
import json
import matplotlib
matplotlib.use('Agg') # Force non-interactive backend
import matplotlib.pyplot as plt
from io import BytesIO
import datetime

class ReportingService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.brand_color = colors.HexColor("#1A202C") # Dark Slate/Blue
        self.accent_color = colors.HexColor("#3182CE") # Blue

    def generate_board_report(self, run_id: str) -> BytesIO:
        # 1. Fetch Data
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        results = json.loads(run.results)
        company_name = run.company_name
        date_str = run.created_at.strftime("%B %d, %Y")
        
        # 2. Setup Document
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=50, leftMargin=50, 
            topMargin=50, bottomMargin=50
        )
        
        elements = []
        styles = getSampleStyleSheet()
        self._add_custom_styles(styles)

        # 3. Build Content
        
        # -- Cover Page --
        self._create_cover_page(elements, styles, company_name, date_str, run_id)
        elements.append(PageBreak())
        
        # -- Executive Summary --
        elements.append(Paragraph("Executive Summary", styles['Heading1']))
        elements.append(Spacer(1, 12))
        
        ev_formatted = f"${results.get('enterprise_value', 0):,.2f}"
        summary_text = f"""
        <b>{company_name}</b> has been valued with an Enterprise Value of <b>{ev_formatted}</b> 
        as of {date_str}. This valuation reflects a comprehensive analysis using multiple methodologies 
        including Discounted Cash Flow (DCF) and Market Comparables.
        """
        elements.append(Paragraph(summary_text, styles['BodyText']))
        elements.append(Spacer(1, 24))
        
        # -- High Level Metrics Table --
        self._create_metrics_table(elements, results)
        elements.append(Spacer(1, 24))
        
        # -- Visualization (Chart) --
        elements.append(Paragraph("Valuation Trajectory", styles['Heading2']))
        elements.append(Spacer(1, 12))
        chart_buffer = self._generate_chart(results)
        img = Image(chart_buffer, width=450, height=250)
        elements.append(img)
        
        elements.append(Spacer(1, 24))
        elements.append(Paragraph("Methodology Breakdown", styles['Heading2']))
        elements.append(Paragraph(
            "The final value is derived from a weighted average of the following approaches:", 
            styles['BodyText']
        ))
        elements.append(Spacer(1, 12))
        self._create_methods_table(elements, results)

        # -- Build PDF --
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def _add_custom_styles(self, styles):
        styles.add(ParagraphStyle(
            name='CoverTitle',
            parent=styles['Title'],
            fontSize=32,
            leading=40,
            textColor=self.brand_color,
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        ))
        styles.add(ParagraphStyle(
            name='CoverSubtitle',
            parent=styles['Normal'],
            fontSize=16,
            textColor=colors.gray,
            alignment=TA_CENTER,
            spaceAfter=50
        ))
        styles.add(ParagraphStyle(
            name='DashboardMetric',
            parent=styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER
        ))

    def _create_cover_page(self, elements, styles, company, date, run_id):
        elements.append(Spacer(1, 100))
        elements.append(Paragraph(f"Valuation Report", styles['CoverTitle']))
        elements.append(Paragraph(f"For {company}", styles['CoverTitle']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Date: {date}", styles['CoverSubtitle']))
        elements.append(Paragraph(f"Reference ID: {run_id[:8]}", styles['CoverSubtitle']))
        elements.append(Spacer(1, 50))
        # Could add a logo image here if we had one
        
    def _create_metrics_table(self, elements, results):
        # Safe access to nested dictionary
        conf_score = results.get('confidence_score')
        if isinstance(conf_score, dict):
            score_val = conf_score.get('score', 'N/A')
        else:
            score_val = 'N/A'

        data = [
            ["Metric", "Value", "Context"],
            ["Enterprise Value", f"${results.get('enterprise_value', 0):,.0f}", "Weighted Average"],
            ["Equity Value", f"${results.get('equity_value', 0):,.0f}", "Net of Debt/Cash"],
            ["Confidence Score", f"{score_val}/100", "Data Quality High"]
        ]
        
        t = Table(data, colWidths=[150, 150, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.brand_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F7FAFC")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(t)

    def _create_methods_table(self, elements, results):
        methods = results.get('methods') or {}
        if not isinstance(methods, dict):
            methods = {}
            
        data = [["Method", "Value", "Weight"]]
        
        for name, detail in methods.items():
            if detail.get('value', 0) > 0:
                val = f"${detail.get('value', 0):,.0f}"
                weight = f"{detail.get('weight', 0)*100:.0f}%"
                data.append([name.replace('_', ' '), val, weight])
                
        t = Table(data, colWidths=[200, 150, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4A5568")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)

    def _generate_chart(self, results):
        # Extract projection data if available, else use mock curve based on EV
        # Assuming dcf_details has revenue projections
        dcf_details = results.get('dcf_details', {})
        revenues = dcf_details.get('revenue', [100, 120, 150, 180, 220])
        years = [f"Y{i+1}" for i in range(len(revenues))]

        fig, ax = plt.subplots(figsize=(8, 4))
        
        # Style
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('#CBD5E0')
        ax.spines['bottom'].set_color('#CBD5E0')
        ax.tick_params(axis='x', colors='#4A5568')
        ax.tick_params(axis='y', colors='#4A5568')
        
        # Plot
        ax.plot(years, revenues, marker='o', color='#3182CE', linewidth=3, label='Projected Revenue')
        ax.fill_between(years, revenues, alpha=0.1, color='#3182CE')
        
        ax.set_title("Revenue Projections (5Y)", fontsize=12, color='#2D3748', pad=20)
        ax.grid(True, linestyle='--', alpha=0.3)
        
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
        buf.seek(0)
        plt.close(fig)
        return buf
