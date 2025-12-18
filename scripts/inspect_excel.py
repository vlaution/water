import pandas as pd
import os

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"

pd.set_option('display.max_rows', 50)
pd.set_option('display.max_columns', 20)
pd.set_option('display.width', 1000)

try:
    xls = pd.ExcelFile(file_path)
    target_sheets = ['Tab 1. User Input>>', 'Inp_1']
    
    for sheet in target_sheets:
        if sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet, nrows=20)
            with open('excel_dump.txt', 'a') as f:
                f.write(f"\n{'='*20} Sheet: {sheet} {'='*20}\n")
                f.write(df.to_string())
        else:
            print(f"Sheet {sheet} not found.")

except Exception as e:
    print(f"Error: {e}")
