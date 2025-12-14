from typing import Dict, List, Any
import json
from backend.database.models import ValuationRun

class ExcelService:
    def export_valuation(self, run: ValuationRun) -> Dict[str, Any]:
        """
        Convert a ValuationRun into a flattened structure suitable for Excel.
        Returns a dictionary representing the 3-sheet structure.
        """
        input_data = json.loads(run.input_data)
        results = json.loads(run.results)
        
        # Sheet 1: Company Overview
        overview = {
            "company_name": run.company_name,
            "valuation_date": run.created_at.isoformat(),
            "currency": input_data.get("currency", "USD"),
            "industry": input_data.get("industry", "Unknown")
        }
        
        # Sheet 2: Financial Inputs (Flattened)
        # We'll flatten the nested input structure into key-value pairs
        financials = self._flatten_inputs(input_data)
        
        # Sheet 3: Valuation Outputs (Read-only)
        outputs = {
            "enterprise_value": results.get("enterprise_value"),
            "equity_value": results.get("equity_value"),
            "share_price": results.get("share_price"),
            "methodology": results.get("methodology")
        }
        
        return {
            "overview": overview,
            "financials": financials,
            "outputs": outputs
        }

    def import_valuation(self, excel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Excel-structured data back into ValuationRun input format.
        """
        overview = excel_data.get("overview", {})
        financials = excel_data.get("financials", {})
        
        # Re-hydrate the flat financials into the nested structure expected by ValuationEngine
        # This is a simplified version; in reality, we'd need a schema mapper
        input_data = self._hydrate_inputs(financials)
        
        # Add overview fields
        input_data["company_name"] = overview.get("company_name")
        input_data["currency"] = overview.get("currency")
        
        return input_data

    def _flatten_inputs(self, data: Dict, parent_key: str = '', sep: str = '_') -> Dict:
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_inputs(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)

    def _hydrate_inputs(self, flat_data: Dict, sep: str = '_') -> Dict:
        result = {}
        for k, v in flat_data.items():
            parts = k.split(sep)
            d = result
            for part in parts[:-1]:
                if part not in d:
                    d[part] = {}
                d = d[part]
            d[parts[-1]] = v
        return result
