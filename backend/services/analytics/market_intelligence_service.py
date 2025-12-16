from typing import List, Dict, Optional
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider
from pydantic import BaseModel

class SectorSignal(BaseModel):
    sector: str
    avg_ev_ebitda: float
    percentile_rank: float # 0-100 (Low is cheap/Buy, High is expensive/Sell)
    signal: str # "Buy", "Sell", "Hold"

class DistressedOpportunity(BaseModel):
    ticker: str
    company_name: str
    sector: str
    ev_ebitda: float
    net_debt_to_ebitda: float
    interest_coverage: float
    distress_score: float # 0-100 (High is more distressed)

class MarketIntelligenceService:
    def __init__(self):
        self.provider = AlphaVantageProvider()
        
        # Representative tickers for sectors (Simplified)
        self.sector_tickers = {
            "Technology": ["MSFT", "AAPL", "ORCL", "ADBE", "CRM"],
            "Healthcare": ["JNJ", "PFE", "UNH", "ABBV", "MRK"],
            "Industrials": ["HON", "UPS", "CAT", "GE", "DE"],
            "Consumer": ["PG", "KO", "PEP", "WMT", "COST"],
            "Energy": ["XOM", "CVX", "COP", "SLB", "EOG"]
        }

    async def analyze_market_cycles(self) -> List[SectorSignal]:
        signals = []
        
        for sector, tickers in self.sector_tickers.items():
            multiples = []
            for ticker in tickers:
                try:
                    m = self.provider.get_company_multiples(ticker)
                    if m and m.get("ev_ebitda"):
                        multiples.append(m["ev_ebitda"])
                except Exception:
                    continue
            
            if not multiples:
                continue
                
            avg_multiple = sum(multiples) / len(multiples)
            
            # Refined Mean Reversion Logic
            # Compare current sector average to "Long Term Average" (LTA)
            # In a real system, LTA would be calculated from DB history.
            # Here we define LTA based on typical industry norms.
            
            long_term_averages = {
                "Technology": 18.0,
                "Healthcare": 14.0,
                "Industrials": 12.0,
                "Consumer": 16.0,
                "Energy": 8.0
            }
            
            lta = long_term_averages.get(sector, 15.0)
            
            # Calculate deviation
            deviation = (avg_multiple - lta) / lta
            
            # Signal Logic
            # > 1 std dev (approx 20%) above LTA -> Sell
            # > 1 std dev below LTA -> Buy
            
            if deviation < -0.15: # 15% undervalued
                signal = "Buy"
                rank = 10 + (deviation + 0.15) * 100 # Scale 0-30
                if rank < 0: rank = 0
            elif deviation > 0.15: # 15% overvalued
                signal = "Sell"
                rank = 70 + (deviation - 0.15) * 100 # Scale 70-100
                if rank > 100: rank = 100
            else:
                signal = "Hold"
                # Map -15% to +15% deviation to 30-70 rank
                # -0.15 -> 30, 0 -> 50, +0.15 -> 70
                rank = 50 + (deviation / 0.15) * 20
                
            signals.append(SectorSignal(
                sector=sector,
                avg_ev_ebitda=round(avg_multiple, 1),
                percentile_rank=round(rank, 1),
                signal=signal
            ))
            
        return signals

    async def screen_distressed_opportunities(self) -> List[DistressedOpportunity]:
        # In a real app, this would scan a database of thousands of companies.
        # Here we will check a specific "Watchlist" of potentially distressed names + some healthy ones
        watchlist = ["AMC", "GME", "CCL", "AAL", "RCL", "XOM", "MSFT"] 
        
        opportunities = []
        
        for ticker in watchlist:
            try:
                # Get Financials
                financials = self.provider.get_financials(ticker)
                metrics = financials.metrics
                
                if not metrics:
                    continue
                
                # Calculate Altman Z-Score
                z_score = self._calculate_altman_z(ticker, financials)
                
                # Check Distress Criteria
                # 1. High Leverage (Net Debt / EBITDA > 4x)
                # 2. Low Altman Z-Score (< 1.8 is Distress Zone)
                
                leverage = metrics.net_debt_to_ebitda or 0
                debt_equity = metrics.debt_to_equity or 0
                
                is_distressed = False
                score = 0
                
                if leverage > 4.0:
                    score += 30
                if leverage > 6.0:
                    score += 20
                    
                if z_score < 1.8:
                    score += 40 # High distress signal
                elif z_score < 3.0:
                    score += 15 # Grey zone
                    
                # Check recent EBITDA growth (negative is bad)
                if metrics.ebitda_growth and metrics.ebitda_growth < 0:
                    score += 10
                    
                if score >= 40:
                    # Fetch live multiple
                    multiples = self.provider.get_company_multiples(ticker)
                    ev_ebitda = multiples.get("ev_ebitda", 0)
                    
                    opportunities.append(DistressedOpportunity(
                        ticker=ticker,
                        company_name=financials.company_name or ticker,
                        sector=financials.sector or "Unknown",
                        ev_ebitda=ev_ebitda,
                        net_debt_to_ebitda=round(leverage, 1),
                        interest_coverage=0, # Placeholder
                        distress_score=score
                    ))
                    
            except Exception as e:
                print(f"Error screening {ticker}: {e}")
                continue
                
        return sorted(opportunities, key=lambda x: x.distress_score, reverse=True)

    def _calculate_altman_z(self, ticker: str, financials) -> float:
        """
        Calculate Altman Z-Score for public manufacturing companies (standard formula).
        Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
        """
        try:
            # Get latest year data
            if not financials.total_assets or not financials.years:
                return 3.0 # Assume healthy if no data
                
            idx = 0 # Latest year
            
            total_assets = financials.total_assets[idx]
            if total_assets == 0:
                return 3.0
                
            # A: Working Capital / Total Assets
            # WC = Current Assets - Current Liabilities
            # We have NWC in metrics usually, or calc from raw
            current_assets = financials.current_assets[idx]
            current_liabilities = financials.current_liabilities[idx]
            working_capital = current_assets - current_liabilities
            A = working_capital / total_assets
            
            # B: Retained Earnings / Total Assets
            # We didn't explicitly map Retained Earnings in HistoricalFinancials yet.
            # Let's approximate or fetch if possible. 
            # For now, use (Total Equity - Share Capital) or just Total Equity * 0.5 as rough proxy if missing?
            # Better: Use Total Equity / Total Assets as a proxy for B (Retained Earnings is part of Equity).
            # This is inexact but directionally correct for solvency.
            # Let's use Total Equity / Total Assets * 0.8 (assuming some is paid in capital)
            total_equity = financials.total_equity[idx]
            retained_earnings_proxy = total_equity * 0.8 
            B = retained_earnings_proxy / total_assets
            
            # C: EBIT / Total Assets
            ebit = financials.ebit[idx]
            C = ebit / total_assets
            
            # D: Market Value of Equity / Total Liabilities
            # Need Market Cap.
            multiples = self.provider.get_company_multiples(ticker)
            market_cap = multiples.get("market_cap", 0)
            total_liabilities = total_assets - total_equity # Basic accounting identity
            
            if total_liabilities <= 0:
                D = 10.0 # Very healthy
            else:
                D = market_cap / total_liabilities
                
            # E: Sales / Total Assets
            sales = financials.revenue[idx]
            E = sales / total_assets
            
            z_score = 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E
            return round(z_score, 2)
            
        except Exception as e:
            print(f"Error calculating Z-Score for {ticker}: {e}")
            return 3.0 # Default to safe

market_intelligence = MarketIntelligenceService()
