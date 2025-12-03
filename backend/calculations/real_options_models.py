from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RealOptionsRequest(BaseModel):
    # Core BSM Inputs
    asset_value: Optional[float] = None  # S: Present Value of underlying flows
    strike_price: float  # K: Investment cost
    time_to_expiration: float  # T: Time in years
    risk_free_rate: Optional[float] = None  # r: Annual risk-free rate
    volatility: Optional[float] = None  # sigma: Annual volatility
    
    # Context for Derivation
    option_type: str = "expansion"  # "patent", "expansion", "abandonment", "delay"
    sector: Optional[str] = None  # For volatility defaults
    dcf_valuation_id: Optional[str] = None  # To link to existing DCF for S

class OptionGreeks(BaseModel):
    delta: float
    gamma: float
    vega: float
    theta: float
    rho: float

class RealOptionsResult(BaseModel):
    option_value: float
    greeks: OptionGreeks
    strategic_insight: str
    inputs_used: Dict[str, Any]  # Return the actual inputs used (after derivation)
