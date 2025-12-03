import unittest
from backend.services.valuation.formulas.dcf import DCFCalculator
from backend.services.valuation.formulas.fcfe import FCFECalculator
from backend.services.valuation.formulas.gpc import GPCCalculator
from backend.services.validation.assumption_validator import AssumptionValidator
from backend.calculations.models import DCFInput, HistoricalFinancials, ProjectionAssumptions, WorkingCapitalAssumptions, DCFEInput, DebtSchedule, GPCInput

class TestValuationLogic(unittest.TestCase):
    def setUp(self):
        # Setup basic inputs
        self.hist = HistoricalFinancials(
            years=[2020, 2021, 2022],
            revenue=[100, 110, 120],
            ebitda=[20, 22, 24],
            ebit=[15, 17, 19],
            net_income=[10, 12, 14],
            capex=[5, 6, 7],
            nwc=[10, 11, 12]
        )
        
        self.proj = ProjectionAssumptions(
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
            historical=self.hist,
            projections=self.proj,
            shares_outstanding=1000,
            net_debt=50
        )

    def test_dcf_calculation(self):
        value, flows, details = DCFCalculator.calculate(self.dcf_input)
        self.assertGreater(value, 0)
        self.assertEqual(len(flows), 5)
        self.assertIn("revenue", details)

    def test_fcfe_calculation(self):
        debt_schedule = [DebtSchedule(beginning_debt=50) for _ in range(5)]
        dcfe_input = DCFEInput(
            historical=self.hist,
            projections=self.proj,
            debt_schedule=debt_schedule,
            cost_of_equity=0.12,
            terminal_growth_rate=0.025
        )
        value = FCFECalculator.calculate(dcfe_input)
        self.assertGreater(value, 0)

    def test_gpc_calculation(self):
        gpc_input = GPCInput(
            target_ticker="TEST",
            peer_tickers=["P1", "P2"],
            metrics={"LTM Revenue": 100, "LTM EBITDA": 20}
        )
        value = GPCCalculator.calculate(gpc_input)
        self.assertGreater(value, 0)

    def test_assumption_validator_wacc(self):
        # Valid WACC
        errors = AssumptionValidator.validate_wacc(0.10)
        self.assertEqual(len(errors), 0)
        
        # Invalid WACC (negative)
        errors = AssumptionValidator.validate_wacc(-0.05)
        # Should have error (<=0) AND warning (outside range)
        self.assertEqual(len(errors), 2)
        self.assertTrue(any(e.severity == "error" for e in errors))
        
        # Warning WACC (too high)
        errors = AssumptionValidator.validate_wacc(0.30)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0].severity, "warning")

    def test_assumption_validator_growth(self):
        # Valid Growth
        errors = AssumptionValidator.validate_growth_rate(0.03, 0.10)
        self.assertEqual(len(errors), 0)
        
        # Invalid Growth (>= WACC)
        errors = AssumptionValidator.validate_growth_rate(0.12, 0.10)
        # Should have error (>= WACC) AND warning (> 6%)
        self.assertEqual(len(errors), 2)
        self.assertTrue(any(e.severity == "error" for e in errors))

if __name__ == '__main__':
    unittest.main()
