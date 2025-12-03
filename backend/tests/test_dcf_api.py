import unittest
from unittest.mock import MagicMock, patch
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput, DCFInput, HistoricalFinancials, ProjectionAssumptions, WorkingCapitalAssumptions

class TestDCFAPI(unittest.TestCase):
    def setUp(self):
        self.engine = ValuationEngine()
        
        # Setup basic DCF Input
        hist = HistoricalFinancials(
            years=[2020, 2021, 2022],
            revenue=[100, 110, 120],
            ebitda=[20, 22, 24],
            ebit=[15, 17, 19],
            net_income=[10, 12, 14],
            capex=[5, 6, 7],
            nwc=[10, 11, 12]
        )
        
        proj = ProjectionAssumptions(
            revenue_growth_start=0.1,
            revenue_growth_end=0.05,
            ebitda_margin_start=0.2,
            ebitda_margin_end=0.25,
            tax_rate=0.25,
            discount_rate=0.10,
            terminal_growth_rate=0.03,
            working_capital=WorkingCapitalAssumptions()
        )
        
        self.dcf_input = DCFInput(
            historical=hist,
            projections=proj,
            shares_outstanding=1000,
            net_debt=50
        )
        
        self.val_input = ValuationInput(
            company_name="Test DCF",
            year=2023,
            value=0,
            dcf_input=self.dcf_input
        )

    @patch('backend.calculations.core.cache')
    def test_caching_logic(self, mock_cache):
        # Setup mock
        mock_cache.get_sync.return_value = None # Cache miss first
        
        # First run
        result1 = self.engine.calculate(self.val_input)
        
        # Verify cache check
        mock_cache.get_sync.assert_called()
        # Verify cache set
        mock_cache.set_sync.assert_called()
        
        # Setup mock for hit
        mock_cache.get_sync.return_value = result1
        
        # Second run
        result2 = self.engine.calculate(self.val_input)
        
        self.assertEqual(result1, result2)
        # Should have returned cached result
        self.assertEqual(mock_cache.get_sync.call_count, 2)

    @patch('backend.calculations.core.cache')
    def test_precompute_sensitivities(self, mock_cache):
        cache_key = "test_key"
        self.engine.precompute_sensitivities(self.val_input, cache_key)
        
        # Verify cache set for sensitivity
        mock_cache.set_sync.assert_called()
        
        # Check arguments
        args, kwargs = mock_cache.set_sync.call_args
        self.assertEqual(args[0], f"sensitivity_{cache_key}")
        
        sensitivity_data = args[1]
        self.assertIn("matrix", sensitivity_data)
        self.assertEqual(len(sensitivity_data["matrix"]), 5) # 5 rows for WACC
        self.assertEqual(len(sensitivity_data["matrix"][0]), 3) # 3 cols for Growth

if __name__ == '__main__':
    unittest.main()
