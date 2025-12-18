import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
output_file = "excel_deep_dive.txt"

try:
    # Read Inp_1 deeper
    df = pd.read_excel(file_path, sheet_name='Inp_1', header=None, skiprows=20, nrows=200)
    
    with open(output_file, 'w') as f:
        f.write("=== Inp_1 (Rows 21-220) ===\n")
        f.write(df.to_string())
        
except Exception as e:
    print(f"Error: {e}")
