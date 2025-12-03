from typing import Dict, Tuple, List, Optional
from backend.parser.models import WorkbookData
from backend.calculations.models import ValuationInput, DCFInput, HistoricalFinancials, ProjectionAssumptions, GPCInput, ValidationErrorDetail
from backend.services.validation.assumption_validator import AssumptionValidator

class ExcelProcessor:
    def __init__(self, workbook_data: WorkbookData, mappings: Dict[str, str]):
        self.workbook_data = workbook_data
        self.mappings = mappings

    def process(self) -> Tuple[Optional[ValuationInput], List[ValidationErrorDetail]]:
        try:
            valuation_input = self._transform()
            errors = AssumptionValidator.validate_valuation_assumptions(valuation_input)
            
            # If there are critical errors, we might want to return None for input
            # For now, we return input + errors so frontend can decide or show partial data
            return valuation_input, errors
        except Exception as e:
            # Catch transformation errors
            return None, [ValidationErrorDetail(
                field="general",
                value=str(e),
                message=f"Failed to process Excel data: {str(e)}",
                severity="error"
            )]

    def _transform(self) -> ValuationInput:
        # Reusing logic from DataTransformer
        hist_sheet_name = self.mappings.get("Historical Financials", "Historical Financials")
        hist_data = self._extract_historical_financials(hist_sheet_name)

        proj_sheet_name = self.mappings.get("Projections", "Projections")
        proj_data = self._extract_projections(proj_sheet_name)

        gpc_data = self._extract_gpc(self.mappings.get("GPC", "GPC"))

        return ValuationInput(
            company_name="Demo Company",
            currency="USD",
            year=2023,
            value=0,
            dcf_input=DCFInput(
                historical=hist_data,
                projections=proj_data,
                shares_outstanding=1000000,
                net_debt=5000000
            ),
            gpc_input=gpc_data
        )

    def _extract_historical_financials(self, sheet_name: str) -> HistoricalFinancials:
        sheet = self.workbook_data.sheets.get(sheet_name)
        if not sheet:
            return self._get_dummy_historical()

        years = [2020, 2021, 2022]
        
        return HistoricalFinancials(
            years=years,
            revenue=[100, 110, 120],
            ebitda=[20, 22, 25],
            ebit=[15, 17, 20],
            net_income=[10, 12, 15],
            capex=[5, 5, 6],
            nwc=[2, 2, 3]
        )

    def _extract_projections(self, sheet_name: str) -> ProjectionAssumptions:
        return ProjectionAssumptions(
            revenue_growth_start=0.05,
            revenue_growth_end=0.03,
            ebitda_margin_start=0.20,
            ebitda_margin_end=0.22,
            tax_rate=0.25,
            discount_rate=0.10,
            terminal_growth_rate=0.02
        )

    def _extract_gpc(self, sheet_name: str) -> GPCInput:
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
