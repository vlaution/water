import unittest
from backend.calculations.fund_models import FundModel
from backend.services.analytics.fund_simulator_service import LBOFundSimulator

class TestWaterfall(unittest.TestCase):
    def setUp(self):
        self.simulator = LBOFundSimulator()
        self.fund = FundModel(
            name="Test Fund",
            vintage_year=2024,
            committed_capital=100,
            management_fee=0.0, # Simplify for waterfall test
            carried_interest=0.20,
            hurdle_rate=0.08,
            fund_term_years=10,
            investment_period_years=5
        )

    def test_waterfall_basic_return(self):
        # Case 1: Return of Capital only (No profit)
        # Year 1: Call 100
        # Year 5: Distribute 100
        raw_flows = {
            1: -100,
            5: 100
        }
        final_flows, gross_dist, invested, distributed, value = self.simulator._calculate_waterfall(self.fund, raw_flows)
        
        # LP should get 100 back. GP 0.
        self.assertEqual(distributed, 100)
        self.assertEqual(invested, 100)

    def test_waterfall_above_hurdle_catchup(self):
        # Case 2: Profitable (2.0x MOIC)
        # Year 1: Call 100
        # Year 2: Distribute 200
        # Hurdle = 100 * 1.08 = 108 (approx)
        # Profit = 200 - 100 = 100
        # Pref = 8
        # Catchup: GP gets 20% of total profit. Total Profit = 100. GP Share = 20.
        # LP Share = 80.
        # Check if distributed is close to 180 (LP) + 20 (GP) = 200?
        # Wait, _calculate_waterfall returns TOTAL distributed (LP+GP).
        # We need to inspect the split inside or the net flow to LP.
        
        raw_flows = {
            1: -100,
            2: 200
        }
        final_flows, gross_dist, invested, distributed, value = self.simulator._calculate_waterfall(self.fund, raw_flows)
        
        # Net Flow to LP at Year 2
        # LP should get: 100 (Capital) + 8 (Pref) + (Remaining Split)
        # Total Profit = 100.
        # GP Target = 20.
        # LP Target = 80.
        # LP Net Flow = 100 (Capital) + 80 (Profit) = 180.
        
        lp_net_flow_y2 = next(f.amount for f in final_flows if f.year == 2)
        
        print(f"LP Net Flow Year 2: {lp_net_flow_y2}")
        
        # Allow small margin for rounding/hurdle calc differences
        self.assertTrue(178 <= lp_net_flow_y2 <= 182, f"Expected ~180, got {lp_net_flow_y2}")

if __name__ == '__main__':
    unittest.main()
