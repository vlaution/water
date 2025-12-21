import math
from typing import Dict
from .decision import Severity

def calculate_severity_score(
    breach_size: float,        # How far from threshold (e.g. 0.15 for 15%)
    recurrence_count: int,     # How many times breached
    time_since_last_breach_days: int, # Days since last breach
    cash_runway_months: float, # Company liquidity
    market_volatility_index: float # e.g. VIX approx or internal 0-100 index
) -> float:
    """
    Compute severity score 0-100 based on objective factors.
    Normalized so that Weighted Sum can reach 100.
    """
    
    # Weights
    WEIGHTS = {
        "breach_magnitude": 0.35,
        "recurrence": 0.25,
        "liquidity_risk": 0.20,
        "external_volatility": 0.15,
        "trend": 0.05
    }
    
    # 1. Breach Magnitude (0-100)
    # 0-10% -> 25, 10-30% -> 60, 30-50% -> 85, >50% -> 100
    if breach_size <= 0.10:
        raw_mag = 25
    elif breach_size <= 0.30:
        raw_mag = 60
    elif breach_size <= 0.50:
        raw_mag = 85
    else:
        raw_mag = 100
    
    mag_contribution = raw_mag * WEIGHTS["breach_magnitude"]
    
    # 2. Recurrence (0-100)
    # 1st time -> 25, 2nd -> 50, 3rd -> 75, 4+ -> 100
    # Clamped at 4
    recur_clamped = min(recurrence_count, 4)
    raw_recur = recur_clamped * 25
    recur_contribution = raw_recur * WEIGHTS["recurrence"]
    
    # 3. Liquidity Risk (0-100)
    # >12m -> 0, <12m -> 40, <6m -> 70, <3m -> 100
    if cash_runway_months >= 12:
        raw_liq = 0
    elif cash_runway_months >= 6:
        raw_liq = 40
    elif cash_runway_months >= 3:
        raw_liq = 70
    else:
        raw_liq = 100
        
    liq_contribution = raw_liq * WEIGHTS["liquidity_risk"]
    
    # 4. External Volatility (0-100)
    # VIX-like: <20 -> 0, 20-30 -> 50, >30 -> 100
    # Or just mapping 0-50 input to 0-100.
    # Assuming input is like VIX (norm ~15-20).
    if market_volatility_index < 20:
        raw_vol = 0
    elif market_volatility_index < 35:
        raw_vol = 50
    else:
        raw_vol = 100
        
    vol_contribution = raw_vol * WEIGHTS["external_volatility"]
    
    # 5. Trend (0-100)
    # If recent breach (<90 days) -> score 100 (bad trend), else 0
    raw_trend = 100 if time_since_last_breach_days < 90 and recurrence_count > 1 else 0
    trend_contribution = raw_trend * WEIGHTS["trend"]
    
    total_score = mag_contribution + recur_contribution + liq_contribution + vol_contribution + trend_contribution
    
    return min(round(total_score, 2), 100.0)

def bucket_severity(score: float) -> Severity:
    """Convert score to severity level."""
    if score < 30:
        return Severity.LOW
    elif score < 50:
        return Severity.MEDIUM
    elif score < 80:
        # User had <90, but 80 is safer for High
        return Severity.HIGH
    else:
        return Severity.CRITICAL
