from backend.parser.models import WorkbookData
from backend.calculations.models import ValuationInput, DCFInput, HistoricalFinancials, ProjectionAssumptions
from typing import Dict, Any, List

class DataTransformer:
    def __init__(self, workbook_data: WorkbookData, mappings: Dict[str, str]):
        self.workbook_data = workbook_data
        self.mappings = mappings # e.g., {"Historical Financials": "Sheet1", "Assumptions": "Sheet2"}

    def transform(self) -> ValuationInput:
        # 1. Extract Historical Financials
        hist_sheet_name = self.mappings.get("Historical Financials", "Historical Financials")
        hist_data = self._extract_historical_financials(hist_sheet_name)

        # 2. Extract Projections
        proj_sheet_name = self.mappings.get("Projections", "Projections")
        proj_data = self._extract_projections(proj_sheet_name)

        # 3. Extract GPC Data
        gpc_data = self._extract_gpc(self.mappings.get("GPC", "GPC"))

        # 4. Construct ValuationInput
        return ValuationInput(
            company_name="Demo Company", # Placeholder
            currency="USD",
            dcf_input=DCFInput(
                historical=hist_data,
                projections=proj_data,
                shares_outstanding=1000000, # Placeholder
                net_debt=5000000 # Placeholder
            ),
            gpc_input=gpc_data
        )

    def _extract_historical_financials(self, sheet_name: str) -> HistoricalFinancials:
        sheet = self.workbook_data.sheets.get(sheet_name)
        if not sheet:
            # Fallback or error
            return self._get_dummy_historical()

        # Logic to find rows by name (e.g. "Revenue", "EBITDA")
        # For MVP, we'll assume standard row names or just grab by index if needed
        # But let's try to be smart and look for "Revenue" in the first column
        
        years = [2020, 2021, 2022] # Placeholder detection
        
        return HistoricalFinancials(
            years=years,
            revenue=[100, 110, 120], # Placeholder extraction
            ebitda=[20, 22, 25],
            ebit=[15, 17, 20],
            net_income=[10, 12, 15],
            capex=[5, 5, 6],
            nwc=[2, 2, 3]
        )

    def _extract_projections(self, sheet_name: str) -> ProjectionAssumptions:
        # Similar logic for projections
        return ProjectionAssumptions(
            revenue_growth_start=0.05,
            revenue_growth_end=0.03,
            ebitda_margin_start=0.20,
            ebitda_margin_end=0.22,
            tax_rate=0.25,
            discount_rate=0.10,
            terminal_growth_rate=0.02
        )

    def _extract_gpc(self, sheet_name: str) -> Any:
        # Mock GPC extraction
        from backend.calculations.models import GPCInput
        return GPCInput(
            target_ticker="TARGET",
            peer_tickers=["PEER1", "PEER2", "PEER3"],
            metrics={"LTM Revenue": 120, "LTM EBITDA": 25}
        )

    def _get_dummy_historical(self) -> HistoricalFinancials:
        return HistoricalFinancials(
            years=[2020, 2021, 2022],
            revenue=[100, 110, 120],
            ebitda=[20, 22, 25],
            ebit=[15, 17, 20],
            net_income=[10, 12, 15],
            capex=[5, 5, 6],
            nwc=[2, 2, 3]
        )
