import pandas as pd
import numpy as np

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"

pd.set_option('display.max_rows', 500)
pd.set_option('display.width', 1000)

try:
    print("Reading Inp_1...")
    # Read a large chunk
    df = pd.read_excel(file_path, sheet_name='Inp_1', header=None, nrows=500)
    
    # Search for keywords
    keywords = ["Revenue", "EBITDA", "Net Income", "Balance Sheet", "Cash", "Debt"]
    
    print("\n--- Keyword Locations ---")
    for keyword in keywords:
        # Find cells containing the keyword (case insensitive)
        mask = df.apply(lambda x: x.astype(str).str.contains(keyword, case=False, na=False))
        if mask.any().any():
            rows, cols = np.where(mask)
            for r, c in zip(rows, cols):
                print(f"Found '{keyword}' at Row {r+1}, Col {c} (Value: {df.iloc[r, c]})")
                # Print context around the match
                print(f"Context (Row {r+1}):")
                print(df.iloc[r, :5].tolist()) # Print first 5 cols of that row
                print("-" * 20)

except Exception as e:
    print(f"Error: {e}")
