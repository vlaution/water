from typing import List, Optional
import numpy as np
from backend.calculations.benchmarking_models import CompanyMetrics, BenchmarkResponse, BenchmarkComparison
from backend.services.financial_data.cache import cache
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider
from backend.services.financial_data.transaction_comps_provider import transaction_comps_provider

# In a real app, we'd use dependency injection or a factory
provider = AlphaVantageProvider()

class BenchmarkingService:
    def get_transaction_comps(self, sector: str) -> List[Dict]:
        return transaction_comps_provider.get_recent_transactions(sector)

    def get_comparison(self, target_ticker: str, peer_tickers: Optional[List[str]] = None, use_sector: bool = False) -> BenchmarkResponse:
        # 1. Get Target Metrics
        target_metrics = self._get_metrics(target_ticker)
        if not target_metrics:
            raise ValueError(f"Could not fetch data for target {target_ticker}")

        # 2. Determine Peers
        final_peers = []
        if peer_tickers:
            final_peers.extend(peer_tickers)
        
        if use_sector:
            sector_peers = self._get_sector_peers(target_ticker)
            # Avoid duplicates and self
            for p in sector_peers:
                if p not in final_peers and p != target_ticker:
                    final_peers.append(p)
        
        # Ensure we have peers
        if not final_peers:
            # Fallback default peers if none found/provided
            final_peers = ["AAPL", "MSFT", "GOOGL"]
            if target_ticker in final_peers:
                final_peers.remove(target_ticker)

        # 3. Get Peer Metrics
        peer_metrics_list = []
        valid_peers = []
        for ticker in final_peers:
            try:
                m = self._get_metrics(ticker)
                if m and self._is_sufficient_data(m):
                    peer_metrics_list.append(m)
                    valid_peers.append(ticker)
            except Exception:
                continue
        
        # 4. Aggregate Peer Data
        peer_avg = self._aggregate_metrics(peer_metrics_list)
        
        # 5. Compare and Calculate Percentiles
        comparisons = self._generate_comparisons(target_metrics, peer_metrics_list, peer_avg)
        
        return BenchmarkResponse(
            target=target_metrics,
            peer_avg=peer_avg,
            comparisons=comparisons,
            peers_used=valid_peers
        )

    def _get_metrics(self, ticker: str) -> Optional[CompanyMetrics]:
        # Try cache first
        cached = cache.get(f"metrics:{ticker}")
        if cached:
            return CompanyMetrics(**cached)
        
        # Fetch financials (triggers calculation and caching)
        try:
            financials = provider.get_financials(ticker)
            return financials.metrics
        except Exception as e:
            print(f"Error fetching metrics for {ticker}: {e}")
            return None

    def _get_sector_peers(self, ticker: str) -> List[str]:
        """
        Get peers in the same sector from the database.
        """
        from backend.database.models import SessionLocal, Company
        db = SessionLocal()
        try:
            # 1. Find target company
            target = db.query(Company).filter(Company.ticker == ticker).first()
            if not target:
                # Fallback if target not in DB
                print(f"Target {ticker} not found in Company DB, using default peers")
                return ["MSFT", "GOOGL", "AMZN", "META", "TSLA"]
            
            # 2. Find peers in same sector
            peers = db.query(Company.ticker)\
                .filter(Company.sector == target.sector)\
                .filter(Company.ticker != ticker)\
                .limit(10)\
                .all()
            
            # Flatten list of tuples
            peer_tickers = [p[0] for p in peers]
            
            if not peer_tickers:
                print(f"No peers found for {ticker} in sector {target.sector}")
                return ["MSFT", "GOOGL", "AMZN"] # Fallback
                
            return peer_tickers
            
        except Exception as e:
            print(f"Error querying sector peers: {e}")
            return ["MSFT", "GOOGL", "AMZN", "META", "TSLA"]
        finally:
            db.close()

    def _is_sufficient_data(self, metrics: CompanyMetrics) -> bool:
        # Check if > 50% of key fields are present
        fields = [
            metrics.roe, metrics.net_margin, metrics.ebitda_margin,
            metrics.current_ratio, metrics.debt_to_equity, metrics.revenue_growth
        ]
        present = sum(1 for f in fields if f is not None)
        return present / len(fields) > 0.5

    def _aggregate_metrics(self, metrics_list: List[CompanyMetrics]) -> CompanyMetrics:
        if not metrics_list:
            return CompanyMetrics(ticker="Peer Avg")
            
        avg_metrics = CompanyMetrics(ticker="Peer Avg", period="LTM")
        
        # Helper to get median of a field
        def get_median(field_name: str) -> Optional[float]:
            values = [getattr(m, field_name) for m in metrics_list if getattr(m, field_name) is not None]
            if not values:
                return None
            return float(np.median(values))

        # Profitability
        avg_metrics.roe = get_median("roe")
        avg_metrics.roa = get_median("roa")
        avg_metrics.roic = get_median("roic")
        avg_metrics.net_margin = get_median("net_margin")
        avg_metrics.gross_margin = get_median("gross_margin")
        avg_metrics.operating_margin = get_median("operating_margin")
        avg_metrics.ebitda_margin = get_median("ebitda_margin")
        
        # Liquidity
        avg_metrics.current_ratio = get_median("current_ratio")
        avg_metrics.quick_ratio = get_median("quick_ratio")
        avg_metrics.cash_ratio = get_median("cash_ratio")
        
        # Leverage
        avg_metrics.debt_to_equity = get_median("debt_to_equity")
        avg_metrics.debt_to_assets = get_median("debt_to_assets")
        avg_metrics.interest_coverage = get_median("interest_coverage")
        avg_metrics.net_debt_to_ebitda = get_median("net_debt_to_ebitda")
        
        # Efficiency
        avg_metrics.asset_turnover = get_median("asset_turnover")
        avg_metrics.inventory_turnover = get_median("inventory_turnover")
        avg_metrics.receivables_turnover = get_median("receivables_turnover")
        
        # Growth
        avg_metrics.revenue_growth = get_median("revenue_growth")
        avg_metrics.ebitda_growth = get_median("ebitda_growth")
        avg_metrics.net_income_growth = get_median("net_income_growth")
        
        return avg_metrics

    def _generate_comparisons(self, target: CompanyMetrics, peers: List[CompanyMetrics], peer_avg: CompanyMetrics) -> List[BenchmarkComparison]:
        comparisons = []
        
        fields = [
            ("ROE", "roe"),
            ("Net Margin", "net_margin"),
            ("EBITDA Margin", "ebitda_margin"),
            ("Current Ratio", "current_ratio"),
            ("Debt/Equity", "debt_to_equity"),
            ("Revenue Growth", "revenue_growth"),
            ("Asset Turnover", "asset_turnover")
        ]
        
        for label, field in fields:
            target_val = getattr(target, field)
            avg_val = getattr(peer_avg, field)
            
            if target_val is None:
                continue
                
            # Calculate Percentile
            percentile = 50.0
            if peers:
                peer_vals = [getattr(p, field) for p in peers if getattr(p, field) is not None]
                if peer_vals:
                    peer_vals.append(target_val) # Include target in distribution
                    peer_vals.sort()
                    # Rank of target
                    rank = peer_vals.index(target_val)
                    percentile = (rank / (len(peer_vals) - 1)) * 100 if len(peer_vals) > 1 else 100.0
            
            # Status
            status = "In Line"
            if avg_val is not None:
                diff = (target_val - avg_val) / abs(avg_val) if avg_val != 0 else 0
                if diff > 0.1:
                    status = "Above Average"
                elif diff < -0.1:
                    status = "Below Average"
            
            comparisons.append(BenchmarkComparison(
                metric=label,
                target_value=target_val,
                peer_average=avg_val,
                industry_average=None, # Placeholder
                percentile=percentile,
                status=status
            ))
            
        return comparisons
