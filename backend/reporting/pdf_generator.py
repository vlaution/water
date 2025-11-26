from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1e3a8a') # System Blue
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.HexColor('#1e40af')
        )
        self.normal_style = self.styles['Normal']

    def generate_executive_summary(self, results: dict, run_id: str) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        story = []

        # Header
        story.append(Paragraph("Valuation Executive Summary", self.title_style))
        
        company_name = results.get('input_summary', {}).get('company_name', 'Target Company')
        story.append(Paragraph(f"Company: {company_name}", self.normal_style))
        story.append(Paragraph(f"Valuation Date: {datetime.now().strftime('%B %d, %Y')}", self.normal_style))
        story.append(Paragraph(f"Run ID: {run_id}", self.normal_style))
        story.append(Spacer(1, 20))

        # 1. Valuation Summary
        story.append(Paragraph("1. Valuation Summary", self.heading_style))
        
        ev = results.get('enterprise_value', 0)
        equity = results.get('equity_value', 0)
        wacc = results.get('wacc', 0)
        
        summary_data = [
            ['Metric', 'Value'],
            ['Enterprise Value', f"${ev:,.0f}"],
            ['Equity Value', f"${equity:,.0f}"],
            ['WACC', f"{wacc:.1%}"]
        ]
        
        t = Table(summary_data, colWidths=[3*inch, 2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(t)

        # 2. Key Assumptions
        story.append(Paragraph("2. Key Assumptions (DCF)", self.heading_style))
        
        dcf_input = results.get('input_summary', {}).get('dcf_input', {}).get('projections', {})
        
        assumptions_data = [
            ['Assumption', 'Value'],
            ['Revenue Growth (Start)', f"{dcf_input.get('revenue_growth_start', 0):.1%}"],
            ['Revenue Growth (End)', f"{dcf_input.get('revenue_growth_end', 0):.1%}"],
            ['EBITDA Margin (Start)', f"{dcf_input.get('ebitda_margin_start', 0):.1%}"],
            ['EBITDA Margin (End)', f"{dcf_input.get('ebitda_margin_end', 0):.1%}"],
            ['Terminal Growth Rate', f"{dcf_input.get('terminal_growth_rate', 0):.1%}"],
            ['Discount Rate', f"{dcf_input.get('discount_rate', 0):.1%}"]
        ]
        
        t2 = Table(assumptions_data, colWidths=[3*inch, 2*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(t2)

        # 3. Sensitivity Analysis (if available)
        if 'sensitivity' in results and results['sensitivity']:
            story.append(Paragraph("3. Sensitivity Analysis", self.heading_style))
            sens = results['sensitivity']
            
            # Create a table for the matrix
            # Header row: Variable 2 values
            header_row = [f"{sens['y_axis']['name']} \\ {sens['x_axis']['name']}"] + [f"{x:.1%}" for x in sens['x_axis']['values']]
            
            matrix_data = [header_row]
            
            for i, row_val in enumerate(sens['y_axis']['values']):
                row = [f"{row_val:.1%}"] + [f"${val/1000000:.1f}M" for val in sens['matrix'][i]]
                matrix_data.append(row)
                
            t3 = Table(matrix_data)
            t3.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('FONTSIZE', (0, 0), (-1, -1), 8)
            ]))
            story.append(t3)

        # 4. Disclaimer
        story.append(Spacer(1, 40))
        story.append(Paragraph("Disclaimer: This report is generated automatically by the Water Valuation Engine. It is for informational purposes only and does not constitute financial advice.", 
                             ParagraphStyle('Disclaimer', parent=self.styles['Normal'], fontSize=8, textColor=colors.grey)))

        doc.build(story)
        buffer.seek(0)
        return buffer.read()
