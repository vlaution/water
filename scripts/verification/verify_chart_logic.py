import sys
import os

# Identify backend path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.report_service import ReportService, ReportConfig

def test_chart_logic():
    print("Testing Chart Logic...")
    
    # Mock Data
    data = {
        "inputs": {"growth_rate": 0.05, "ebitda_margin": 0.20},
        "outputs": {
            "enterprise_value": 1000000,
            "equity_value": 800000,
            "wacc": 0.10,
            "pv_fcf": 600000,
            "terminal_value": 400000,
            "net_debt": 200000,
            "dcf_valuation": True # Trigger for chart
        }
    }
    
    config = ReportConfig(
        sections=["Executive Summary"],
        format="pdf",
        branding=True,
        valuation_id="test-123",
        company_name="Chart Test Corp"
    )
    
    service = ReportService()
    try:
        pdf_buffer = service.generate_report(config, data)
        print(f"PDF Generated. Size: {pdf_buffer.getbuffer().nbytes} bytes")
        
        # Save for manual inspection if needed
        with open("chart_test.pdf", "wb") as f:
            f.write(pdf_buffer.getvalue())
        print("Saved to chart_test.pdf")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_chart_logic()
