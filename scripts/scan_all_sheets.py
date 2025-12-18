import pandas as pd
import numpy as np

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"

try:
    xls = pd.ExcelFile(file_path)
    print("All Sheets:", xls.sheet_names)
    
    # Check for years in all sheets
    years = [2021, 2022, 2023, 2024, 2025]
    
    for sheet in xls.sheet_names:
        print(f"\nScanning {sheet}...")
        try:
            df = pd.read_excel(xls, sheet_name=sheet, header=None, nrows=100)
            
            # Check for year-like values
            mask = df.isin(years)
            if mask.any().any():
                print(f"!!! FOUND YEARS IN {sheet} !!!")
                print(df.head(20))
            else:
                # Print first few non-empty rows just in case
                print(df.dropna(how='all').head(5))
                
        except Exception as e:
            print(f"Error reading {sheet}: {e}")

except Exception as e:
    print(f"Error: {e}")
