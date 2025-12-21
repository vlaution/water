from dataclasses import dataclass, replace
from enum import Enum
from typing import Dict, List, Optional

class ActionType(Enum):
    NOTIFY = "notify"
    ACTION = "action"
    ANALYSIS = "analysis"
    MEETING = "meeting"
    NEGOTIATE = "negotiate"
    REVIEW = "review"
    HEDGE = "hedge"
    CONTACT = "contact"
    PREPARE = "prepare"
    SCHEDULE = "schedule"
    ADJUST = "adjust"
    UPDATE = "update"

@dataclass(frozen=True)
class ActionStep:
    step_id: str
    type: ActionType
    description: str
    recipient_or_target: Optional[str] = None
    deadline_hours: Optional[int] = None
    required_role: str = "Analyst" # Default

# Template Definition
ACTION_TEMPLATES: Dict[str, List[ActionStep]] = {
    # Covenant breaches (Legacy/Base)
    "ebitda_covenant_breach": [
        ActionStep("1", ActionType.NOTIFY, "Notify Debt committee within 24 hours", "Debt Committee", 24, "VP"),
        ActionStep("2", ActionType.ACTION, "Freeze non-essential capex immediately", "CAPEX Budget", 0, "CFO"),
        ActionStep("3", ActionType.ANALYSIS, "Run downside LBO case with 20% haircut", "LBO Model", 48, "Associate"),
        ActionStep("4", ActionType.MEETING, "Schedule lender discussion within 7 days", "Lenders", 168, "Partner")
    ],
    "debt_covenant_breach": [
        ActionStep("1", ActionType.NOTIFY, "Notify General counsel for waiver documentation", "General Counsel", 24, "VP"),
        ActionStep("2", ActionType.ANALYSIS, "Model debt restructuring scenarios", "Debt Model", 48, "Associate"),
        ActionStep("3", ActionType.ACTION, "Prepare equity cure analysis", "Equity Cure Model", 72, "Associate"),
        ActionStep("4", ActionType.MEETING, "Board special committee review", "Board", 168, "Partner")
    ],

    # Forecast Miss
    "forecast_miss_warning": [
        ActionStep("1", ActionType.ANALYSIS, "Investigate root cause (market vs execution)", "Variance Report", 48, "Associate"),
        ActionStep("2", ActionType.REVIEW, "Management forecast credibility score", "Forecast Model", 24, "VP"),
        ActionStep("3", ActionType.ADJUST, "Portfolio valuation marks -5%", "Valuation Model", 24, "Associate"),
        ActionStep("4", ActionType.NOTIFY, "Monitor next quarter closely for pattern", "Watchlist", 168, "Associate")
    ],
    "forecast_miss_critical": [
        ActionStep("1", ActionType.ANALYSIS, "Deep dive on operational breakdown", "Ops Review", 48, "Director"),
        ActionStep("2", ActionType.MEETING, "Emergency management review", "Management", 24, "Partner"),
        ActionStep("3", ActionType.ADJUST, "Portfolio valuation marks -15%", "Valuation Model", 24, "VP"),
        ActionStep("4", ActionType.UPDATE, "Investor quarterly letter with explanation", "LPs", 72, "Partner"),
        ActionStep("5", ActionType.ACTION, "Consider management changes if pattern continues", "Board", 168, "Partner")
    ],

    # Risk Concentration
    "risk_concentration_warning": [
        ActionStep("1", ActionType.ANALYSIS, "Customer/supplier diversification scenarios", "Risk Model", 48, "Associate"),
        ActionStep("2", ActionType.NEGOTIATE, "Long-term agreement with key entity", "Key Customer", 168, "CEO"),
        ActionStep("3", ActionType.ACTION, "Business development pipeline acceleration", "Sales Team", 72, "CRO"),
        ActionStep("4", ActionType.HEDGE, "Credit insurance on key receivables", "Insurance Broker", 72, "CFO")
    ],
    "risk_concentration_critical": [
        ActionStep("1", ActionType.ANALYSIS, "Stress test losing key entity", "Downside Model", 24, "Associate"),
        ActionStep("2", ActionType.ACTION, "Immediate diversification efforts", "Sales Strategy", 24, "CRO"),
        ActionStep("3", ActionType.HEDGE, "Maximum available insurance coverage", "Insurance Broker", 48, "CFO"),
        ActionStep("4", ActionType.MEETING, "Special committee review of concentration risk", "Board", 72, "Partner"),
        ActionStep("5", ActionType.PREPARE, "Strategy: Acquisition of competitor to diversify", "M&A Pipeline", 168, "VP")
    ],

    # Volatility Spike
    "volatility_spike_warning": [
        ActionStep("1", ActionType.ANALYSIS, "Stress test portfolio at 2x current volatility", "Risk Model", 24, "Analyst"),
        ActionStep("2", ActionType.ACTION, "Increase cash position by 10%", "Treasury", 48, "CFO"),
        ActionStep("3", ActionType.HEDGE, "Review put option coverage on public positions", "Hedge Book", 24, "Trader"),
        ActionStep("4", ActionType.NOTIFY, "Daily risk reporting for 30 days", "Risk Committee", 24, "Risk Officer")
    ],
    "volatility_spike_critical": [
        ActionStep("1", ActionType.ANALYSIS, "Maximum loss scenario at 3x volatility", "Stress Test", 4, "Risk Officer"),
        ActionStep("2", ActionType.ACTION, "Increase cash position by 25%", "Treasury", 24, "CFO"),
        ActionStep("3", ActionType.HEDGE, "Execute downside protection trades", "Trading Desk", 2, "Trader"),
        ActionStep("4", ActionType.NOTIFY, "Intraday risk reporting", "Risk Committee", 4, "Risk Officer"),
        ActionStep("5", ActionType.UPDATE, "Investor update on risk management", "Investors", 24, "Partner")
    ],

    # Cash Runway
    "cash_runway_12mo": [
        ActionStep("1", ActionType.ANALYSIS, "12-month cash flow forecast update", "CF Model", 48, "Associate"),
        ActionStep("2", ActionType.PREPARE, "Equity/debt financing options analysis", "Capital Markets", 72, "VP"),
        ActionStep("3", ActionType.ACTION, "Review discretionary spending", "Budget", 48, "CFO"),
        ActionStep("4", ActionType.NOTIFY, "Monitor Monthly cash position", "Management", 168, "Associate")
    ],
    "cash_runway_6mo": [
        ActionStep("1", ActionType.ANALYSIS, "6-month cash flow forecast with sensitivities", "CF Model", 24, "Associate"),
        ActionStep("2", ActionType.CONTACT, "Banking relationships for bridge financing", "Lenders", 48, "CFO"),
        ActionStep("3", ActionType.ACTION, "Freeze non-essential hires and capex", "HR/Finite", 0, "CEO"),
        ActionStep("4", ActionType.PREPARE, "Prepare liquidity contingency plan", "Board", 48, "VP")
    ],
    "cash_runway_3mo": [
        ActionStep("1", ActionType.ANALYSIS, "13-week cash flow forecast", "CF Model", 4, "Associate"),
        ActionStep("2", ActionType.ACTION, "Activate revolving credit facility", "Treasury", 24, "CFO"),
        ActionStep("3", ActionType.NEGOTIATE, "Extend payables, accelerate receivables", "Vendors/Clients", 48, "CFO"),
        ActionStep("4", ActionType.MEETING, "Emergency Board meeting within 48 hours", "Board", 24, "Chairman"),
        ActionStep("5", ActionType.ANALYSIS, "Options: Distressed financing or sale process", "Strategic Review", 48, "Partner")
    ]
}

def get_actions_for_trigger(trigger: str, context: Dict) -> List[ActionStep]:
    """
    Get pre-approved actions for a trigger, contextualized.
    Returns structured ActionStep objects.
    """
    templates = ACTION_TEMPLATES.get(trigger, [])
    
    contextualized_steps = []
    
    for step in templates:
        # Clone because frozen
        new_desc = step.description
        
        # Simple string replacement for context
        if "{{company}}" in new_desc and "company_name" in context:
            new_desc = new_desc.replace("{{company}}", context["company_name"])
        if "{{amount}}" in new_desc and "breach_amount" in context:
            amount_str = f"${context['breach_amount']:,.0f}"
            new_desc = new_desc.replace("{{amount}}", amount_str)
            
        contextualized_steps.append(replace(step, description=new_desc))
            
    return contextualized_steps
