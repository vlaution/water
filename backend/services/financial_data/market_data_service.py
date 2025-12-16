import os
import requests
from typing import Dict, Any, Optional, List
from backend.services.financial_data.cache import cache
from datetime import datetime, timedelta

class MarketDataService:
    FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
    
    def __init__(self):
        self.fred_api_key = os.getenv("FRED_API_KEY")
        # Fallback values if API fails or key is missing
        self.defaults = {
            "risk_free_rate": 4.25, # percent
            "corporate_spread_bbb": 1.15, # percent
            "high_yield_spread": 3.50, # percent
        }
        self.av_api_key = os.getenv("ALPHA_VANTAGE_KEY")
        self.av_api_key = os.getenv("ALPHA_VANTAGE_KEY")
        self.AV_BASE_URL = "https://www.alphavantage.co/query"
        
        # Mock Data based on typical market conditions
        self.base_leverage_multiples = {
            "Technology": {"senior": 4.5, "total": 6.5},
            "Healthcare": {"senior": 4.0, "total": 6.0},
            "Industrials": {"senior": 3.5, "total": 5.0},
            "Consumer": {"senior": 3.5, "total": 5.5},
            "default": {"senior": 3.5, "total": 5.0}
        }

    def _fetch_av_overview(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetches Company Overview from Alpha Vantage (includes EV/EBITDA, PE, etc).
        """
        api_key = os.getenv("ALPHA_VANTAGE_KEY")
        if not api_key:
            return None
            
        cache_key = f"av_overview_{symbol}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            params = {
                "function": "OVERVIEW",
                "symbol": symbol,
                "apikey": api_key
            }
            response = requests.get(self.AV_BASE_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if "Symbol" in data:
                # Cache for 24 hours as fundamental data changes slowly
                cache.set(cache_key, data, ttl=86400) 
                return data
        except Exception as e:
            print(f"Error fetching Alpha Vantage data for {symbol}: {e}")
            
        return None

    def _fetch_fred_series(self, series_id: str) -> Optional[float]:
        """
        Fetches the latest value for a FRED series.
        """
        cache_key = f"fred_series_{series_id}"
        cached_val = cache.get(cache_key)
        if cached_val is not None:
            return cached_val

        api_key = os.getenv("FRED_API_KEY")
        if not api_key:
            return None

        try:
            params = {
                "series_id": series_id,
                "api_key": api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            response = requests.get(self.FRED_BASE_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if "observations" in data and len(data["observations"]) > 0:
                val = float(data["observations"][0]["value"])
                cache.set(cache_key, val)
                return val
        except Exception as e:
            print(f"Error fetching FRED series {series_id}: {e}")
            
        return None

    @cache.cached(ttl=3600)
    def fetch_interest_rates(self) -> Dict[str, float]:
        """
        Returns a dictionary of current interest rates (in decimal format, e.g. 0.05 for 5%).
        """
        # 1. 10-Year Treasury Constant Maturity Rate (DGS10)
        rf_rate = self._fetch_fred_series("DGS10")
        if rf_rate is None:
            rf_rate = self.defaults["risk_free_rate"]
            
        # 2. ICE BofA BBB US Corp Index Option-Adjusted Spread (BAMLC0A4CBBB)
        bbb_spread = self._fetch_fred_series("BAMLC0A4CBBB")
        if bbb_spread is None:
            bbb_spread = self.defaults["corporate_spread_bbb"]

        # 3. ICE BofA US High Yield Index Option-Adjusted Spread (BAMLH0A0HYM2)
        hy_spread = self._fetch_fred_series("BAMLH0A0HYM2")
        if hy_spread is None:
            hy_spread = self.defaults["high_yield_spread"]

        return {
            "risk_free_rate": rf_rate / 100.0,
            "senior_debt_rate": (rf_rate + bbb_spread) / 100.0,
            "mezzanine_debt_rate": (rf_rate + hy_spread) / 100.0,
            "preferred_equity_rate": (rf_rate + hy_spread + 2.0) / 100.0 # Heuristic: HY + 200bps
        }

    @cache.cached(ttl=3600)
    def fetch_leverage_multiples(self, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns typical leverage multiples (Debt/EBITDA) for LBOs.
        Ideally this comes from PitchBook/S&P index data. Using mocked/heuristic data for now.
        """
        selected = self.base_leverage_multiples.get(sector, self.base_leverage_multiples["default"])
        
        return {
            "senior_leverage": selected["senior"],
            "total_leverage": selected["total"],
            "equity_contribution_percent": 0.40 # 40% equity is standard in high rate environment
        }

    def fetch_all_leverage_multiples(self) -> Dict[str, Any]:
        """
        Returns leverage multiples for all sectors (for Heatmap).
        """
        return self.base_leverage_multiples



    @cache.cached(ttl=3600)
    def fetch_exit_multiples(self, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns trading multiples for sectors. 
        Tries to use Alpha Vantage with sector proxies, falls back to mock data.
        """
        # 1. Try Alpha Vantage Proxy
        # ETFs often don't have EV/EBITDA in 'OVERVIEW', so using largest constituents as proxies
        sector_proxies = {
            "Technology": "AAPL", # Apple as proxy for Tech
            "Healthcare": "UNH",  # UnitedHealth
            "Industrials": "HON", # Honeywell
            "Consumer": "AMZN",   # Amazon
            "Energy": "XOM",      # Exxon
            "Financials": "JPM"   # JP Morgan
        }
        
        proxy_symbol = sector_proxies.get(sector)
        if proxy_symbol and os.getenv("ALPHA_VANTAGE_KEY"):
            data = self._fetch_av_overview(proxy_symbol)
            if data and "EVToEBITDA" in data and data["EVToEBITDA"] != "None":
                try:
                    ev_ebitda = float(data["EVToEBITDA"])
                    return {
                        "ev_ebitda": ev_ebitda,
                        "source": f"Live ({proxy_symbol})",
                        "trend": "stable" 
                    }
                except ValueError:
                    pass

        # 2. Fallback to Mock Data
        sector_multiples = {
            "Technology": 15.0,
            "Healthcare": 12.0,
            "Industrials": 8.0,
            "Consumer": 10.0,
            "default": 10.0
        }
        
        mult = sector_multiples.get(sector, sector_multiples["default"])
        
        return {
            "ev_ebitda": mult,
            "source": "Historical/Mock",
            "trend": "stable" 
        }

market_data_service = MarketDataService()
