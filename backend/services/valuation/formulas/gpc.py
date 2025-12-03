from backend.calculations.models import GPCInput

class GPCCalculator:
    @staticmethod
    def calculate(gpc_input: GPCInput) -> float:
        if not gpc_input:
            return 0.0
            
        # Mock multiples - in a real scenario these would come from the input or a service
        # For now we assume the input has the necessary data or we use defaults/mocks as in core.py
        # But core.py had hardcoded mocks. Ideally, GPCInput should carry the multiples.
        # Let's assume for now we keep the logic but we should probably improve this later.
        # Wait, core.py used hardcoded mocks. I should probably stick to that for now to maintain behavior,
        # or better, assume the input MIGHT have them.
        # Actually, looking at core.py, it ignores peer_tickers and uses hardcoded multiples.
        # I will keep the hardcoded multiples for now to ensure I don't break existing "functionality" (even if it's mock).
        
        multiples = {
            "PEER1": {"EV/Rev": 2.0, "EV/EBITDA": 10.0},
            "PEER2": {"EV/Rev": 2.5, "EV/EBITDA": 12.0},
            "PEER3": {"EV/Rev": 1.8, "EV/EBITDA": 9.0}
        }
        
        ev_rev_median = sorted([m["EV/Rev"] for m in multiples.values()])[1]
        ev_ebitda_median = sorted([m["EV/EBITDA"] for m in multiples.values()])[1]
        
        val_revenue = gpc_input.metrics["LTM Revenue"] * ev_rev_median
        val_ebitda = gpc_input.metrics["LTM EBITDA"] * ev_ebitda_median
        
        return ((val_revenue + val_ebitda) / 2) * 1000000
