import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"

pd.set_option('display.max_rows', 100)
pd.set_option('display.width', 1000)

try:
    xls = pd.ExcelFile(file_path)
    
    for sheet in xls.sheet_names:
        print(f"\nScanning {sheet} for 'Revenue'...")
        try:
            df = pd.read_excel(xls, sheet_name=sheet, header=None, nrows=100)
            
            # Find keyword
            mask = df.apply(lambda x: x.astype(str).str.contains("Revenue", case=False, na=False))
            if mask.any().any():
                print(f"!!! FOUND REVENUE IN {sheet} !!!")
                # Print the context
                print(df[mask.any(axis=1)].head())
                
                # If found, try to print surrounding rows to see the table
                idx = df[mask.any(axis=1)].index[0]
                start = max(0, idx - 2)
                end = min(len(df), idx + 10)
                print(f"--- Context (Rows {start}-{end}) ---")
                print(df.iloc[start:end])
                
        except Exception as e:
            print(f"Error reading {sheet}: {e}")

except Exception as e:
    print(f"Error: {e}")
