from backend.services.peer_finding_service import PeerFindingService
from backend.calculations.models import GPCInput
import statistics

class GPCCalculator:
    @staticmethod
    def calculate(gpc_input: GPCInput) -> float:
        if not gpc_input or not gpc_input.metrics:
            return 0.0
            
        service = PeerFindingService()
        peer_tickers = gpc_input.peer_tickers
        
        # If no peers provided, try to find some (optional, but good fallback)
        if not peer_tickers:
            peer_tickers = service.find_peers(gpc_input.target_ticker)
            
        ev_rev_multiples = []
        ev_ebitda_multiples = []
        
        for ticker in peer_tickers:
            metrics = service.get_company_metrics(ticker)
            if metrics:
                # EV approximation: Market Cap (since we lack debt data in seed)
                # Ideally: EV = Market Cap + Net Debt
                ev = metrics["market_cap"] 
                rev = metrics["revenue"]
                ebitda = metrics["ebitda"]
                
                if rev > 0:
                    ev_rev_multiples.append(ev / rev)
                if ebitda > 0:
                    ev_ebitda_multiples.append(ev / ebitda)
        
        # Fallback to defaults if no data found
        if not ev_rev_multiples: ev_rev_multiples = [2.0]
        if not ev_ebitda_multiples: ev_ebitda_multiples = [10.0]
        
        # Use provided multiples or calculate median
        ev_rev_median = gpc_input.ev_revenue_multiple if gpc_input.ev_revenue_multiple is not None else statistics.median(ev_rev_multiples)
        ev_ebitda_median = gpc_input.ev_ebitda_multiple if gpc_input.ev_ebitda_multiple is not None else statistics.median(ev_ebitda_multiples)
        
        val_revenue = gpc_input.metrics.get("LTM Revenue", 0) * ev_rev_median
        val_ebitda = gpc_input.metrics.get("LTM EBITDA", 0) * ev_ebitda_median
        
        # Average the two methods
        if val_revenue > 0 and val_ebitda > 0:
            return ((val_revenue + val_ebitda) / 2) * 1000000
        elif val_revenue > 0:
            return val_revenue * 1000000
        elif val_ebitda > 0:
            return val_ebitda * 1000000
        else:
            return 0.0
