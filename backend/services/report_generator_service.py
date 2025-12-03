from typing import Dict, Any
import json
from datetime import datetime

class ReportGeneratorService:
    def generate_report(self, run_data: Dict[str, Any], company_name: str) -> str:
        """
        Generates a print-optimized HTML report for the valuation run.
        """
        results = run_data.get("results", {})
        input_summary = results.get("input_summary", {})
        enterprise_value = results.get("enterprise_value", 0)
        equity_value = results.get("equity_value", 0)
        share_price = results.get("share_price", 0)
        
        # Format currency helper
        def fmt_currency(val):
            if val is None: return "$0.00"
            if val >= 1_000_000_000:
                return f"${val/1_000_000_000:.2f}B"
            if val >= 1_000_000:
                return f"${val/1_000_000:.2f}M"
            return f"${val:,.2f}"

        def fmt_percent(val):
            if val is None: return "0.0%"
            return f"{val*100:.1f}%"

        # Sections
        
        # 1. Header
        header_html = f"""
        <div class="header">
            <div class="logo">Valuation Platform</div>
            <div class="meta">
                <h1>{company_name}</h1>
                <p>Valuation Report</p>
                <p class="date">{datetime.now().strftime("%B %d, %Y")}</p>
            </div>
        </div>
        """
        
        # 2. Executive Summary
        exec_summary_html = f"""
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="grid-2">
                <div class="card highlight">
                    <h3>Enterprise Value</h3>
                    <div class="value">{fmt_currency(enterprise_value)}</div>
                </div>
                <div class="card">
                    <h3>Equity Value</h3>
                    <div class="value">{fmt_currency(equity_value)}</div>
                </div>
                <div class="card">
                    <h3>Implied Share Price</h3>
                    <div class="value">{fmt_currency(share_price)}</div>
                </div>
                <div class="card">
                    <h3>WACC</h3>
                    <div class="value">{fmt_percent(input_summary.get("dcf_input", {}).get("projections", {}).get("discount_rate"))}</div>
                </div>
            </div>
        </div>
        """
        
        # 3. DCF Details
        dcf_details = results.get("dcf_details", {})
        dcf_html = ""
        if dcf_details:
            rows = ""
            years = len(dcf_details.get("revenue", []))
            
            # Header Row
            rows += "<tr><th>Metric</th>" + "".join([f"<th>Year {i+1}</th>" for i in range(years)]) + "</tr>"
            
            # Data Rows
            def add_row(label, data, is_curr=True):
                row = f"<tr><td>{label}</td>"
                for val in data:
                    row += f"<td>{fmt_currency(val) if is_curr else fmt_percent(val)}</td>"
                row += "</tr>"
                return row

            rows += add_row("Revenue", dcf_details.get("revenue", []))
            rows += add_row("EBITDA", dcf_details.get("ebitda", []))
            rows += add_row("FCFF", dcf_details.get("fcff", []))
            
            dcf_html = f"""
            <div class="section">
                <h2>Discounted Cash Flow (DCF) Analysis</h2>
                <table>
                    {rows}
                </table>
                <p><strong>Terminal Value:</strong> {fmt_currency(dcf_details.get("terminal_value"))}</p>
                <p><strong>PV of Terminal Value:</strong> {fmt_currency(dcf_details.get("pv_terminal_value"))}</p>
            </div>
            """

        # 4. PWSA Results
        pwsa_html = ""
        # Check if PWSA was run (might be in results or separate, depending on how we stored it)
        # Based on previous steps, PWSA is a separate endpoint, but maybe we want to include it if available?
        # For now, let's assume standard results. If PWSA is not in standard results, we might skip or need to fetch it.
        # The prompt implies generating report from `run_data`.
        # If PWSA isn't persisted in `ValuationRun.results`, we can't show it easily without fetching.
        # Let's check `ValuationRun` model or `routes.py` save logic.
        # In `routes.py`, `run_valuation` saves `results`. `calculate_pwsa` returns result but doesn't seem to save to DB linked to run?
        # Actually, `calculate_pwsa` was just a calculation endpoint. It didn't save to `ValuationRun`.
        # So for this report, we might only have the base valuation.
        # We'll stick to base valuation for now as per "View Full Report" context which usually refers to the main run.
        
        # 5. Peer Analysis (GPC)
        # If GPC inputs were used
        gpc_input = input_summary.get("gpc_input", {})
        gpc_html = ""
        if gpc_input and gpc_input.get("metrics"):
            metrics = gpc_input.get("metrics", {})
            gpc_html = f"""
            <div class="section">
                <h2>Guideline Public Company (GPC) Analysis</h2>
                <div class="grid-2">
                    <div class="card">
                        <h3>LTM Revenue</h3>
                        <div class="value">{fmt_currency(metrics.get("LTM Revenue"))}</div>
                    </div>
                    <div class="card">
                        <h3>LTM EBITDA</h3>
                        <div class="value">{fmt_currency(metrics.get("LTM EBITDA"))}</div>
                    </div>
                </div>
            </div>
            """

        # Full HTML
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{company_name} - Valuation Report</title>
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 1000px; mx-auto; padding: 40px; }}
                .header {{ border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #0066cc; }}
                .meta {{ text-align: right; }}
                h1 {{ margin: 0; font-size: 32px; }}
                .date {{ color: #888; margin: 5px 0 0; }}
                .section {{ margin-bottom: 40px; page-break-inside: avoid; }}
                h2 {{ border-bottom: 1px solid #eee; padding-bottom: 10px; color: #444; margin-bottom: 20px; }}
                .grid-2 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
                .card {{ background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee; }}
                .card.highlight {{ background: #f0f7ff; border-color: #cce4ff; }}
                .card h3 {{ margin: 0 0 10px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }}
                .value {{ font-size: 24px; font-weight: bold; color: #222; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
                th {{ text-align: left; border-bottom: 2px solid #ddd; padding: 10px; color: #666; }}
                td {{ border-bottom: 1px solid #eee; padding: 10px; }}
                tr:last-child td {{ border-bottom: none; }}
                @media print {{
                    body {{ padding: 0; max-width: none; }}
                    .no-print {{ display: none; }}
                    .card {{ border: 1px solid #ddd; }}
                }}
            </style>
        </head>
        <body>
            {header_html}
            {exec_summary_html}
            {dcf_html}
            {gpc_html}
            
            <div class="section">
                <h2>Disclaimer</h2>
                <p style="font-size: 12px; color: #888;">
                    This report is generated for informational purposes only. The valuation figures are estimates based on the provided assumptions and inputs. 
                    They do not constitute financial advice or a fairness opinion.
                </p>
            </div>
            
            <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
                <button onclick="window.print()" style="background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    Download / Print PDF
                </button>
            </div>
        </body>
        </html>
        """
        return html
