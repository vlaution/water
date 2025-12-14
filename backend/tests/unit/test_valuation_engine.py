import pytest
from unittest.mock import MagicMock, patch
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput, DCFInput, ProjectionAssumptions, HistoricalFinancials, WorkingCapitalAssumptions
from backend.services.valuation.formulas.dcf import DCFCalculator

@pytest.fixture
def mock_valuation_input():
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
    dcf_input = DCFInput(
        historical=hist,
        projections=proj,
        shares_outstanding=1000,
        net_debt=50
    )
    return ValuationInput(
        company_name="Test Company",
        dcf_input=dcf_input,
        gpc_input=None,
        dcfe_input=None,
        precedent_transactions_input=None,
        lbo_input=None,
        anav_input=None,
        vc_method_input=None,
        method_weights=None,
        scenarios=None,
        sensitivity_analysis=None
    )

@patch('backend.calculations.core.DCFCalculator')
@patch('backend.calculations.core.GPCCalculator')
@patch('backend.calculations.core.FCFECalculator')
@patch('backend.calculations.core.PrecedentTransactionsCalculator')
@patch('backend.calculations.core.LBOCalculator')
@patch('backend.calculations.core.ANAVCalculator')
@patch('backend.calculations.core.VCMethodCalculator')
@patch('backend.calculations.core.AssumptionValidator')
@patch('backend.calculations.core.cache')
@patch('backend.calculations.core.SessionLocal')
def test_calculate_runs_all_methods(
    mock_session, mock_cache, mock_validator, 
    mock_vc, mock_anav, mock_lbo, mock_pt, mock_fcfe, mock_gpc, mock_dcf,
    mock_valuation_input
):
    # Setup mocks
    mock_dcf.calculate.return_value = (1000.0, [], {})
    mock_gpc.calculate.return_value = 0.0
    mock_fcfe.calculate.return_value = 0.0
    mock_pt.calculate.return_value = 0.0
    mock_lbo.calculate.return_value = 0.0
    mock_anav.calculate.return_value = 0.0
    mock_vc.calculate.return_value = None
    
    mock_validator.validate_valuation_assumptions.return_value = []
    mock_cache.get_sync.return_value = None
    
    # Mock internal method to avoid extra DCF calls
    with patch.object(ValuationEngine, 'generate_sensitivity_matrix', return_value={}) as mock_sens:
        engine = ValuationEngine(workbook_data=None, mappings=None)
        result = engine.calculate(mock_valuation_input)
        
        assert result["enterprise_value"] == 1000.0
        assert result["equity_value"] == 950.0 # 1000 - 50 net debt
        
        # Verify DCF was called exactly once for the main calculation
        mock_dcf.calculate.assert_called_once()
        mock_sens.assert_called_once()

@patch('backend.calculations.core.DCFCalculator')
@patch('backend.calculations.core.cache')
@patch('backend.calculations.core.SessionLocal')
def test_calculate_uses_cache(mock_session, mock_cache, mock_dcf, mock_valuation_input):
    # Setup cache hit
    cached_result = {"enterprise_value": 5000}
    mock_cache.get_sync.return_value = cached_result
    
    engine = ValuationEngine(workbook_data=None, mappings=None)
    result = engine.calculate(mock_valuation_input)
    
    assert result == cached_result
    # Verify DCF was NOT called
    mock_dcf.calculate.assert_not_called()

def test_generate_cache_key(mock_valuation_input):
    engine = ValuationEngine(workbook_data=None, mappings=None)
    key1 = engine._generate_cache_key(mock_valuation_input)
    key2 = engine._generate_cache_key(mock_valuation_input)
    assert key1 == key2
    assert key1.startswith("valuation:")
