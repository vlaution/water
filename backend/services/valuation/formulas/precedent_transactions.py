from backend.calculations.models import PrecedentTransactionsInput
import statistics

class PrecedentTransactionsCalculator:
    @staticmethod
    def calculate(pt_input: PrecedentTransactionsInput) -> float:
        if not pt_input or not pt_input.transactions:
            return 0.0
        
        ev_revenue_multiples = []
        ev_ebitda_multiples = []
        
        for txn in pt_input.transactions:
            if txn.ev_revenue_multiple > 0:
                ev_revenue_multiples.append(txn.ev_revenue_multiple)
            if txn.ev_ebitda_multiple > 0:
                ev_ebitda_multiples.append(txn.ev_ebitda_multiple)
        
        if pt_input.use_median:
            ev_rev_multiple = statistics.median(ev_revenue_multiples) if ev_revenue_multiples else 0
            ev_ebitda_multiple = statistics.median(ev_ebitda_multiples) if ev_ebitda_multiples else 0
        else:
            ev_rev_multiple = sum(ev_revenue_multiples) / len(ev_revenue_multiples) if ev_revenue_multiples else 0
            ev_ebitda_multiple = sum(ev_ebitda_multiples) / len(ev_ebitda_multiples) if ev_ebitda_multiples else 0
        
        val_by_revenue = pt_input.target_revenue * ev_rev_multiple
        val_by_ebitda = pt_input.target_ebitda * ev_ebitda_multiple
        
        if val_by_revenue > 0 and val_by_ebitda > 0:
            return ((val_by_revenue + val_by_ebitda) / 2) * 1000000
        elif val_by_revenue > 0:
            return val_by_revenue * 1000000
        elif val_by_ebitda > 0:
            return val_by_ebitda * 1000000
        else:
            return 0.0
