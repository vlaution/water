import sys
import json
# Add current directory to path so we can import backend
sys.path.append("c:/Users/Abhiram/Desktop/water")

from backend.parser.core import SheetParser

FILE_PATH = "c:/Users/Abhiram/Desktop/water/valuation_automation_dashboard.xlsm"
OUTPUT_PATH = "c:/Users/Abhiram/Desktop/water/parsed_output.json"

def main():
    try:
        parser = SheetParser(FILE_PATH)
        print(f"Parsing {FILE_PATH}...")
        workbook_data = parser.parse()
        
        # Convert to dict for JSON serialization
        data_dict = workbook_data.model_dump()
        
        with open(OUTPUT_PATH, 'w') as f:
            json.dump(data_dict, f, indent=2, default=str)
            
        print(f"Successfully parsed. Output saved to {OUTPUT_PATH}")
        
        # Print summary
        for sheet_name, sheet_data in workbook_data.sheets.items():
            print(f"Sheet: {sheet_name}, Rows: {len(sheet_data.rows)}")
            if sheet_data.rows:
                print(f"  Headers: {sheet_data.headers}")
                # Print first row to check data mapping
                print(f"  Sample Row 1: {str(sheet_data.rows[0])[:200]}...") 
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
