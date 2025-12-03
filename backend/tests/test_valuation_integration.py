import unittest
from unittest.mock import MagicMock
from backend.services.data_import.excel_processor import ExcelProcessor
from backend.calculations.core import ValuationEngine
from backend.parser.models import WorkbookData

class TestValuationIntegration(unittest.TestCase):
    def setUp(self):
        self.workbook_data = MagicMock(spec=WorkbookData)
        self.workbook_data.sheets = MagicMock()
        self.workbook_data.sheets.get.return_value = None # Trigger dummy data
        self.mappings = {"Historical Financials": "Sheet1"}

    def test_excel_processor_success(self):
        processor = ExcelProcessor(self.workbook_data, self.mappings)
        val_input, errors = processor.process()
        
        self.assertIsNotNone(val_input)
        # Should have no critical errors with dummy data
        self.assertFalse(any(e.severity == "error" for e in errors))
        
    def test_valuation_engine_integration(self):
        processor = ExcelProcessor(self.workbook_data, self.mappings)
        val_input, _ = processor.process()
        
        engine = ValuationEngine()
        results = engine.calculate(val_input)
        
        self.assertIn("enterprise_value", results)
        self.assertGreater(results["enterprise_value"], 0)
        self.assertIn("methods", results)
        self.assertIn("DCF_FCFF", results["methods"])

    def test_validation_error_flow(self):
        # Mock processor to return invalid input
        processor = ExcelProcessor(self.workbook_data, self.mappings)
        val_input, _ = processor.process()
        
        # Inject invalid data
        val_input.dcf_input.projections.discount_rate = -0.05
        
        # Run validation via Engine (which calls AssumptionValidator)
        engine = ValuationEngine()
        results = engine.calculate(val_input)
        
        # Check for critical errors in results
        self.assertIn("critical_errors", results)
        self.assertTrue(len(results["critical_errors"]) > 0)
        self.assertIn("WACC must be a positive number.", results["critical_errors"][0])

if __name__ == '__main__':
    unittest.main()
