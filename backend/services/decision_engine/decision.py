from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
import uuid

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Signal(Enum):
    COVENANT_BREACH = "covenant_breach"
    CASH_RUNWAY = "cash_runway"
    FORECAST_MISS = "forecast_miss"
    RISK_CONCENTRATION = "risk_concentration"
    VOLATILITY_SPIKE = "volatility_spike"
    LIQUIDITY_EVENT = "liquidity_event"
    CUSTOMER_CONCENTRATION = "customer_concentration"
    # Added for compatibility with existing tests/placeholders if strictly needed, 
    # but ideally we should stick to the specific list. 
    # For now, I will stick to the user's list.

class DecisionState(Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    OVERRIDDEN = "overridden"
    ESCALATED = "escalated"

@dataclass
class Decision:
    # Core triad: Signal × Context × Severity
    signal: Signal
    context: Dict[str, float]  # {metric: value, ...}
    severity: Severity
    
    # Why this matters
    why_now: List[str]  # ["Second consecutive breach", "Cash runway < 9 months"]
    
    # Actions (predefined templates ONLY)
    recommended_actions: List[str]  # From action_templates.py
    
    # Confidence (math, not guesses)
    confidence: float  # 0-1, computed
    
    # Metadata
    decision_id: str
    timestamp: datetime
    triggered_by: str  # Which rule/alert triggered this
    metadata: Dict[str, Any] = field(default_factory=dict) # NEW: For detailed explanations/extra data
    
    # Lead Time Analysis Fields
    first_triggered_date: Optional[datetime] = None  # When your engine fired
    related_event_date: Optional[datetime] = None  # When the bad thing actually happened
    calculated_lead_days: Optional[int] = None  # event_date - triggered_date

    # Lifecycle State
    state: DecisionState = DecisionState.ACTIVE
    state_history: List[Dict] = field(default_factory=list)

    # Counterfactual / What-If
    counterfactual: Optional[Dict[str, Any]] = None

    # Accountability / Audit
    acknowledgement_hash: Optional[str] = None
    
    # Immutable - once created, cannot change (Removed frozen=True for state updates)
    def __post_init__(self):
        # Validation logic
        if not (0 <= self.confidence <= 1):
            raise ValueError("Confidence must be between 0 and 1")
        if len(self.recommended_actions) == 0:
            raise ValueError("Must have at least one recommended action")

    @staticmethod
    def create(
        signal: Signal,
        context: Dict[str, float],
        severity: Severity,
        why_now: List[str],
        recommended_actions: List[str],
        confidence: float,
        triggered_by: str,
        metadata: Dict[str, Any] = None,
        first_triggered_date: Optional[datetime] = None,
        related_event_date: Optional[datetime] = None,
        calculated_lead_days: Optional[int] = None
    ) -> 'Decision':
        return Decision(
            signal=signal,
            context=context,
            severity=severity,
            why_now=why_now,
            recommended_actions=recommended_actions,
            confidence=confidence,
            decision_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            triggered_by=triggered_by,
            metadata=metadata or {},
            first_triggered_date=first_triggered_date,
            related_event_date=related_event_date,
            calculated_lead_days=calculated_lead_days
        )
