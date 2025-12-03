from backend.calculations.models import DCFEInput

class FCFECalculator:
    @staticmethod
    def calculate(dcfe_input: DCFEInput) -> float:
        if not dcfe_input:
            return 0.0
        
        proj = dcfe_input.projections
        hist = dcfe_input.historical
        debt_schedule = dcfe_input.debt_schedule
        
        last_revenue = hist.revenue[-1]
        projected_fcfe = []
        
        current_revenue = last_revenue
        for i in range(5):
            growth = proj.revenue_growth_start + (proj.revenue_growth_end - proj.revenue_growth_start) * (i / 4)
            margin = proj.ebitda_margin_start + (proj.ebitda_margin_end - proj.ebitda_margin_start) * (i / 4)
            
            current_revenue *= (1 + growth)
            ebitda = current_revenue * margin
            
            net_income = ebitda * (1 - proj.tax_rate) * 0.7
            
            capex = current_revenue * 0.05
            delta_nwc = current_revenue * 0.02
            
            net_borrowing = debt_schedule[i].net_borrowing if i < len(debt_schedule) else 0
            
            fcfe = net_income - capex - delta_nwc + net_borrowing
            projected_fcfe.append(fcfe)
        
        last_fcfe = projected_fcfe[-1]
        terminal_value = last_fcfe * (1 + dcfe_input.terminal_growth_rate) / (dcfe_input.cost_of_equity - dcfe_input.terminal_growth_rate)
        
        present_value = 0
        for i, fcfe in enumerate(projected_fcfe):
            present_value += fcfe / ((1 + dcfe_input.cost_of_equity) ** (i + 1))
        
        present_value += terminal_value / ((1 + dcfe_input.cost_of_equity) ** 5)
        
        return present_value * 1000000
