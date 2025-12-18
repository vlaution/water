import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
output_file = "excel_wide_dump.txt"

pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 20)
pd.set_option('display.width', 1000)

try:
    xls = pd.ExcelFile(file_path)
    
    with open(output_file, 'w') as f:
        # Check Inp_1 wide
        if 'Inp_1' in xls.sheet_names:
            f.write("\n=== Inp_1 (Rows 40-100, Cols A-M) ===\n")
            df = pd.read_excel(xls, sheet_name='Inp_1', header=None, skiprows=40, nrows=60, usecols="A:M")
            f.write(df.to_string())

        # Check WC & Capex
        if 'WC & Capex' in xls.sheet_names:
            f.write("\n\n=== WC & Capex (Rows 0-20) ===\n")
            df_wc = pd.read_excel(xls, sheet_name='WC & Capex', header=None, nrows=20)
            f.write(df_wc.to_string())

except Exception as e:
    print(f"Error: {e}")
