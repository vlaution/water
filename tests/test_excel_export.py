import sys
sys.path.insert(0, 'c:/Users/Abhiram/Desktop/water')

from backend.utils.excel_export import create_valuation_excel
import json

# Test data
run_data = {
    "company_name": "Test Company",
    "mode": "manual",
    "created_at": "2025-11-24T21:23:09.840400",
    "input_data": json.dumps({"company_name": "Test", "dcf_input": {"historical": {"years": [2020], "revenue": [100], "ebitda": [20], "ebit": [15], "net_income": [10], "capex": [5], "nwc": [2]}, "projections": {"revenue_growth_start": 0.05, "discount_rate": 0.1}}}),
    "results": json.dumps({"enterprise_value": 1000000, "equity_value": 900000, "wacc": 0.10, "methods": {"DCF": {"value": 1000000, "weight": 0.5}}})
}

try:
    excel_file = create_valuation_excel(run_data)
    print("Excel file created successfully!")
    print(f"File size: {len(excel_file.getvalue())} bytes")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
