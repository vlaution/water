import math
import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.calculations.real_options_models import RealOptionsRequest, RealOptionsResult, OptionGreeks
from backend.services.financial_data.factory import FinancialDataFactory
from backend.database.models import ValuationRun

# Helper functions for Normal Distribution
def norm_pdf(x):
    return math.exp(-x**2 / 2) / math.sqrt(2 * math.pi)

def norm_cdf(x):
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

class RealOptionsService:
    def __init__(self):
        self.financial_provider = FinancialDataFactory.get_provider()

    async def calculate_option_value(self, request: RealOptionsRequest, db: Optional[Session] = None) -> RealOptionsResult:
        # 1. Validate and Enrich Inputs
        validated_inputs = await self._validate_and_enrich_inputs(request, db)
        
        S = validated_inputs.asset_value
        K = validated_inputs.strike_price
        T = validated_inputs.time_to_expiration
        r = validated_inputs.risk_free_rate
        sigma = validated_inputs.volatility
        
        # 2. Calculate Option Value (BSM)
        # Most real options are treated as Call Options (Right to Expand/Delay/Invest)
        # Abandonment is a Put Option.
        is_put = request.option_type.lower() == "abandonment"
        
        if is_put:
            value = self._black_scholes_put(S, K, T, r, sigma)
        else:
            value = self._black_scholes_call(S, K, T, r, sigma)
            
        # 3. Calculate Greeks
        greeks = self._calculate_greeks(S, K, T, r, sigma, is_put)
        
        # 4. Generate Insight
        insight = self._generate_strategic_insight(request.option_type, value, validated_inputs)
        
        return RealOptionsResult(
            option_value=value,
            greeks=greeks,
            strategic_insight=insight,
            inputs_used={
                "asset_value": S,
                "strike_price": K,
                "time_to_expiration": T,
                "risk_free_rate": r,
                "volatility": sigma,
                "option_type": request.option_type
            }
        )

    async def _validate_and_enrich_inputs(self, request: RealOptionsRequest, db: Optional[Session] = None) -> RealOptionsRequest:
        """Intelligently populate missing inputs."""
        # Risk Free Rate
        if request.risk_free_rate is None:
            try:
                # Fetch 10y Treasury Yield
                request.risk_free_rate = self.financial_provider.get_treasury_yield()
            except Exception:
                request.risk_free_rate = 0.04 # Fallback to 4%
                
        # Volatility
        if request.volatility is None:
            # Default based on sector or general high uncertainty for real options
            # In a real app, we'd query sector volatility.
            # For now, we use reasonable defaults.
            sector_vols = {
                "technology": 0.40,
                "biotech": 0.60,
                "energy": 0.35,
                "manufacturing": 0.25
            }
            request.volatility = sector_vols.get(request.sector.lower(), 0.30) if request.sector else 0.30
            
        # Asset Value (S)
        if request.asset_value is None or request.asset_value == 0:
            # If linked to a DCF
            if request.dcf_valuation_id and db:
                request.asset_value = self._get_pv_from_dcf(request.dcf_valuation_id, db)
            
            # If still missing, default to K (ATM)
            if request.asset_value is None or request.asset_value == 0:
                 request.asset_value = request.strike_price # Assume ATM if unknown
        
        return request

    def _get_pv_from_dcf(self, run_id: str, db: Session) -> float:
        """Fetch the Enterprise Value (PV of flows) from a saved DCF run."""
        try:
            run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
            if not run:
                return 0.0
            
            results = json.loads(run.results)
            # Try to get Enterprise Value, fallback to DCF value if specific
            return results.get("enterprise_value", 0.0)
        except Exception as e:
            print(f"Error fetching DCF value: {e}")
            return 0.0

    def _black_scholes_call(self, S, K, T, r, sigma):
        if T <= 0: return max(S - K, 0)
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        return S * norm_cdf(d1) - K * math.exp(-r * T) * norm_cdf(d2)

    def _black_scholes_put(self, S, K, T, r, sigma):
        if T <= 0: return max(K - S, 0)
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        return K * math.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)

    def _calculate_greeks(self, S, K, T, r, sigma, is_put):
        if T <= 0:
            return OptionGreeks(delta=0, gamma=0, vega=0, theta=0, rho=0)
            
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        
        # Common Greeks
        gamma = norm_pdf(d1) / (S * sigma * math.sqrt(T))
        vega = S * norm_pdf(d1) * math.sqrt(T) # Usually divided by 100 for % change
        
        if is_put:
            delta = norm_cdf(d1) - 1
            theta = (-S * norm_pdf(d1) * sigma / (2 * math.sqrt(T)) + 
                     r * K * math.exp(-r * T) * norm_cdf(-d2))
            rho = -K * T * math.exp(-r * T) * norm_cdf(-d2)
        else:
            delta = norm_cdf(d1)
            theta = (-S * norm_pdf(d1) * sigma / (2 * math.sqrt(T)) - 
                     r * K * math.exp(-r * T) * norm_cdf(d2))
            rho = K * T * math.exp(-r * T) * norm_cdf(d2)
            
        return OptionGreeks(
            delta=delta,
            gamma=gamma,
            vega=vega / 100, # Scaled for 1% vol change
            theta=theta / 365, # Scaled for 1 day time decay
            rho=rho / 100 # Scaled for 1% rate change
        )

    def _generate_strategic_insight(self, option_type: str, value: float, inputs: RealOptionsRequest) -> str:
        S_fmt = f"${inputs.asset_value/1e6:.1f}M"
        K_fmt = f"${inputs.strike_price/1e6:.1f}M"
        Val_fmt = f"${value/1e6:.1f}M"
        
        if option_type.lower() == "patent":
            return (f"The strategic value of this patent is estimated at **{Val_fmt}**. "
                    f"This reflects the right to commercialize the technology (investing {K_fmt}) "
                    f"over the next {inputs.time_to_expiration} years. "
                    f"High volatility ({inputs.volatility:.0%}) increases this value by preserving upside potential.")
        
        elif option_type.lower() == "expansion":
            return (f"The option to expand operations is worth **{Val_fmt}**. "
                    f"Even if the project is currently NPV neutral (Asset Value {S_fmt} ≈ Cost {K_fmt}), "
                    f"the flexibility to wait and observe market conditions for {inputs.time_to_expiration} years adds significant value.")
                    
        elif option_type.lower() == "abandonment":
            return (f"The option to abandon the project and recover {K_fmt} (salvage value) "
                    f"provides a safety net worth **{Val_fmt}**. "
                    f"This downside protection mitigates the risk of the project's value dropping below {S_fmt}.")
            
        elif option_type.lower() == "delay":
            return (f"The value of waiting is **{Val_fmt}**. "
                    f"By delaying the {K_fmt} investment, you avoid committing capital during uncertain times, "
                    f"while retaining the potential upside.")
            
        return f"The calculated real option value is **{Val_fmt}**."
