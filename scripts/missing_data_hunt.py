import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
output_file = "missing_data_hunt.txt"

pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 20)
pd.set_option('display.width', 1000)

try:
    xls = pd.ExcelFile(file_path)
    
    with open(output_file, 'w') as f:
        # 1. Check WC & Capex deeper
        if 'WC & Capex' in xls.sheet_names:
            f.write("\n=== WC & Capex (Rows 0-50) ===\n")
            df_wc = pd.read_excel(xls, sheet_name='WC & Capex', header=None, nrows=50)
            f.write(df_wc.to_string())

        # 2. Check Back_end_links wider/deeper
        if 'Back_end_links' in xls.sheet_names:
            f.write("\n\n=== Back_end_links (Rows 0-100) ===\n")
            # Maybe historicals are above or below? 
            # Or maybe LTM is the only history there?
            df_be = pd.read_excel(xls, sheet_name='Back_end_links', header=None, nrows=100)
            f.write(df_be.to_string())
            
except Exception as e:
    print(f"Error: {e}")
