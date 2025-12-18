import pandas as pd

file_path = "C:\\Users\\Abhiram\\Desktop\\water\\Valuation_Automation_Dashboard_Draft 12_AJ.xlsm"
output_file = "backend_links_dump.txt"

try:
    # Read Back_end_links
    # Based on previous find_revenue, relevant data starts around row 19
    df = pd.read_excel(file_path, sheet_name='Back_end_links', header=None, skiprows=18, nrows=10)
    
    with open(output_file, 'w') as f:
        f.write("=== Back_end_links (Rows 19-28) ===\n")
        f.write(df.to_string())
        
except Exception as e:
    print(f"Error: {e}")
