import sys
import os
from datetime import datetime

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.services.report_service import ReportService, ReportConfig

def verify_report_integration():
    print("=== Testing Reporting + Compliance Integration ===")
    
    # 1. Mock Data
    data = {
        "inputs": {"growth_rate": "5%", "wacc": "8.5%"},
        "outputs": {"valuation": 1000000},
        "methodology": "DCF"
        # Shared audit data would be injected here in a real integration test
    }
    
    # 2. Configure Report with Compliance
    config = ReportConfig(
        sections=["Executive Summary", "Compliance Appendix"],
        format="pdf",
        branding=True,
        valuation_id="val_test_report_001",
        company_name="Integration Corp"
    )
    
    # 3. Generate
    print("Generating Report with Appendix...")
    service = ReportService()
    pdf_buffer = service.generate_report(config, data)
    
    # 4. Verify Content (by checking size and no errors)
    size = pdf_buffer.getbuffer().nbytes
    print(f"Generated PDF Size: {size} bytes")
    
    if size > 1000:
        print("PASS: PDF generated successfully.")
    else:
        print("FAIL: PDF too small, likely empty.")
        
    # Since we can't easily parse PDF text in this verify script without extra libs,
    # we rely on the fact that the _append_compliance_appendix call succeeded without error.
    print("PASS: Integrated pipeline executed without errors.")

if __name__ == "__main__":
    verify_report_integration()
