import os

# Auditing Thresholds
AUDIT_THRESHOLDS = {
    "perpetual_growth_rate_max": 0.10,  # 10%
    "wacc_industry_deviation_factor": 0.5, # 0.5 x industry avg
    "revenue_growth_max": 0.50, # 50% - flags unrealistic near-term growth
    "ev_to_ebitda_industry_deviation_factor_max": 2.0, # >2x industry avg
    "ev_to_ebitda_industry_deviation_factor_min": 0.5, # <0.5x industry avg
    "debt_to_equity_max": 4.0, # Very high leverage
    "negative_cash_flow_years": 5, # Warn if projecting negative FCF for >5 years
}
