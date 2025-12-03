import unittest
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput, VCMethodInput, ReturnType, DCFInput, HistoricalFinancials, ProjectionAssumptions

class TestVCMethod(unittest.TestCase):
    def setUp(self):
        self.engine = ValuationEngine()
        self.vc_input = VCMethodInput(
            investment_amount=2000000,
            target_return_type=ReturnType.MULTIPLE,
            target_return=10.0,
            exit_year=5,
            exit_metric="revenue",
            projected_exit_metric=20000000,
            exit_multiple=5.0,
            current_shares=1000000
        )

    def test_calculate_vc_method_multiple(self):
        from backend.services.valuation.formulas.vc_method import VCMethodCalculator
        result = VCMethodCalculator.calculate(self.vc_input)
        
        # Exit Value = 20M * 5 = 100M
        self.assertEqual(result.exit_value, 100000000)
        
        # Post Money = 100M / 10 = 10M
        self.assertEqual(result.post_money_valuation, 10000000)
        
        # Pre Money = 10M - 2M = 8M
        self.assertEqual(result.pre_money_valuation, 8000000)
        
        # Ownership = 2M / 10M = 20%
        self.assertEqual(result.ownership_required, 0.2)
        
        # New Shares = (0.2 / 0.8) * 1M = 250,000
        self.assertEqual(result.new_shares_issued, 250000)

    def test_calculate_vc_method_irr(self):
        from backend.services.valuation.formulas.vc_method import VCMethodCalculator
        self.vc_input.target_return_type = ReturnType.IRR
        self.vc_input.target_return = 0.50 # 50% IRR
        
        result = VCMethodCalculator.calculate(self.vc_input)
        
        # Exit Value = 100M
        # Target Multiple = (1.5)^5 = 7.59375
        expected_multiple = 1.5 ** 5
        expected_post_money = 100000000 / expected_multiple
        
        self.assertAlmostEqual(result.post_money_valuation, expected_post_money, places=2)

    def test_audit_warnings(self):
        from backend.services.valuation.formulas.vc_method import VCMethodCalculator
        # Set high investment to force high ownership
        self.vc_input.investment_amount = 6000000 # 6M on 10M post = 60%
        
        result = VCMethodCalculator.calculate(self.vc_input)
        
        self.assertEqual(result.ownership_required, 0.6)
        self.assertTrue(len(result.audit_issues) > 0)
        self.assertEqual(result.audit_issues[0].severity, "warning")
        self.assertIn("highly dilutive", result.audit_issues[0].message)

    def test_integration_calculate(self):
        # Create full valuation input
        val_input = ValuationInput(
            company_name="Test Startup",
            year=2023,
            value=0,
            vc_method_input=self.vc_input
        )
        
        results = self.engine.calculate(val_input)
        
        self.assertIn("VC_Method", results["methods"])
        self.assertEqual(results["methods"]["VC_Method"]["value"], 8000000)
        self.assertIsNotNone(results["vc_method"])

if __name__ == '__main__':
    unittest.main()
