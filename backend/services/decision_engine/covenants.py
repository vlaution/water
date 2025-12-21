from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime
import uuid

@dataclass(frozen=True)
class Covenant:
    id: str
    name: str # e.g. "Senior Debt Leverage"
    metric: str  # "EBITDA", "Debt/EBITDA", "Cash_Balance"
    threshold: float
    direction: str  # "above" or "below". Meaning breach if (dir="above" & val > thresh)
    grace_period_days: int
    action_triggers: List[str]  # Keys to suggested actions

@dataclass(frozen=True)
class CovenantBreach:
    breach_id: str
    covenant_id: str
    covenant_name: str
    metric_name: str
    threshold_value: float
    actual_value: float
    delta: float
    severity: str # "critical" etc. derived logic could go here
    detected_at: datetime

def check_covenant_breaches(
    metrics: Dict[str, float], 
    covenants: List[Covenant]
) -> List[CovenantBreach]:
    """
    Check provided metrics against a list of company-specific covenants.
    
    Args:
        metrics: Dictionary of current financial metrics (e.g. {"EBITDA": 100}).
        covenants: List of Covenant rules applicable to this company.
        
    Returns:
        List of CovenantBreach objects for any violations.
    """
    breaches = []
    
    for covenant in covenants:
        current_value = metrics.get(covenant.metric)
        if current_value is None:
            # Metric missing, cannot evaluate. 
            # In a real system, might return a definition error or warning.
            continue
            
        is_breach = False
        if covenant.direction == "below":
            if current_value < covenant.threshold:
                is_breach = True
        elif covenant.direction == "above":
            if current_value > covenant.threshold:
                is_breach = True
                
        if is_breach:
            breaches.append(CovenantBreach(
                breach_id=str(uuid.uuid4()),
                covenant_id=covenant.id,
                covenant_name=covenant.name,
                metric_name=covenant.metric,
                threshold_value=covenant.threshold,
                actual_value=current_value,
                delta=current_value - covenant.threshold,
                severity="critical", # Covenants are usually critical
                detected_at=datetime.utcnow()
            ))
            
    return breaches

# Example factory for testing/defaults
def get_default_covenants() -> List[Covenant]:
    return [
        Covenant(
            id="defs_1",
            name="EBITDA Minimum",
            metric="EBITDA",
            threshold=5000000.0,
            direction="below",
            grace_period_days=30,
            action_triggers=["capital_call"]         
        ),
        Covenant(
            id="defs_2",
            name="Leverage Ratio Max",
            metric="Debt/EBITDA",
            threshold=4.5,
            direction="above",
            grace_period_days=15,
            action_triggers=["deleveraging_plan"]
        )
    ]
