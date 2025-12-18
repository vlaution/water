import sys
import os
# Add root to sys.path
sys.path.append(os.getcwd())

from backend.parser.valuation_parser import ValuationExcelParser

file_path = r"C:\Users\Abhiram\Desktop\water\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    sys.exit(1)

with open(file_path, "rb") as f:
    content = f.read()

try:
    parser = ValuationExcelParser(content)
    data = parser.parse()
    print("SUCCESS")
    print(f"Company: {data.company_name}")
    print(f"Financials Found: {len(data.financials)}")
    if data.balance_sheet:
        print("Balance Sheet Snapshot:")
        print(f"  Cash: {data.balance_sheet.cash}")
        print(f"  Debt: {data.balance_sheet.debt}")
    
    print(f"Working Capital Years: {len(data.working_capital)}")
    if data.working_capital:
        print(f"  First Year WC: {data.working_capital[0].working_capital}")
        
    print(f"Capex Years: {len(data.capex)}")
    
    print(f"Valuation Results: {len(data.valuation_results)}")
    for res in data.valuation_results:
        print(f"  {res.method}: {res.enterprise_value} (Wt: {res.weight})")
        
    if data.wacc_metrics:
        print("WACC Metrics:")
        print(f"  WACC: {data.wacc_metrics.wacc}")
        print(f"  Cost of Equity: {data.wacc_metrics.cost_of_equity}")
        print(f"  Risk Free: {data.wacc_metrics.risk_free_rate}")

except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
