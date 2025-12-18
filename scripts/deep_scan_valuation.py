import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
output_file = "deep_scan_results.txt"

pd.set_option('display.max_rows', 200)
pd.set_option('display.width', 1000)

try:
    xls = pd.ExcelFile(file_path)
    
    with open(output_file, 'w') as f:
        f.write("=== SHEET LIST ===\n")
        f.write(str(xls.sheet_names) + "\n\n")

        # 1. Valuation Summary in Back_end_links (Rows 45-60 approx based on previous dump)
        if 'Back_end_links' in xls.sheet_names:
            f.write("=== Valuation Summary (Back_end_links) ===\n")
            df = pd.read_excel(xls, sheet_name='Back_end_links', header=None, skiprows=45, nrows=20)
            f.write(df.to_string())
            f.write("\n\n")

        # 2. Search for WACC / Cost of Capital across all sheets
        f.write("=== WACC / Cost of Capital Search ===\n")
        keywords = ["WACC", "Cost of Equity", "Risk Free", "Beta", "Market Risk Premium", "Terminal Value"]
        
        for sheet in xls.sheet_names:
            try:
                # Read header/first few cols to be fast, or small chunks
                # WACC is usually near the top or in a specific assumption section
                df_scan = pd.read_excel(xls, sheet_name=sheet, header=None, nrows=100)
                
                mask = df_scan.apply(lambda x: x.astype(str).str.contains('|'.join(keywords), case=False, na=False))
                if mask.any().any():
                    f.write(f"\n[FOUND KEYWORDS IN {sheet}]\n")
                    # Get rows with matches
                    matched_rows = df_scan[mask.any(axis=1)]
                    f.write(matched_rows.to_string())
                    f.write("\n")
            except Exception as e:
                f.write(f"Error scanning {sheet}: {e}\n")

except Exception as e:
    print(f"Error: {e}")
