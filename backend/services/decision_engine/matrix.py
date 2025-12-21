from typing import List, Dict, Optional, Any
from .decision import Decision, Signal, Severity

class Rule:
    def __init__(
        self,
        signal: Signal,
        min_severity: Severity,
        market_condition_filter: Optional[List[str]] = None,
        recommended_actions: List[str] = [],
        why_now_template: str = "",
        priority: int = 5
    ):
        self.signal = signal
        self.min_severity = min_severity
        self.market_condition_filter = market_condition_filter
        self.recommended_actions = recommended_actions
        self.why_now_template = why_now_template
        self.priority = priority

    def matches(self, signal: Signal, context: Dict[str, float], severity: Severity, market_condition: str) -> bool:
        if signal != self.signal:
            return False
        
        # Severity check
        severity_levels = {
            Severity.LOW: 1,
            Severity.MEDIUM: 2,
            Severity.HIGH: 3,
            Severity.CRITICAL: 4
        }
        if severity_levels[severity] < severity_levels[self.min_severity]:
            return False

        # Context check (Market Condition)
        # Assuming context might contain 'market_condition' encoded as a float or passed separately.
        # The new Decision context is Dict[str, float], so it can't hold strings.
        # However, the user request showed: context: Dict[str, float].
        # But earlier Context had 'market_condition' as str.
        # If the user strict `context: Dict[str, float]` implies only numeric metrics.
        # I will assume 'market_condition' is passed separately to the engine or inferred from metrics (e.g. VIX).
        # For this implementation, I will treat specific numeric thresholds in context if needed, 
        # but the Rule might still need access to categorical context if available.
        # Given the strict constraint, I'll rely on the signal and severity for now, 
        # or assume specific numeric context triggers.
        # WAIT: The User's prompt for Decision class has `context: Dict[str, float]`.
        # It does NOT have categorical context in the dataclass.
        # However, the input to the engine might still have it? 
        # The user said: "Model Outputs (DCF, LBO, Comps), Covenant Rules, Historical Trends, Market Context" in the diagram.
        # But the dataclass `Decision` restricts context to `Dict[str, float]`.
        # I will stick to the dataclass. If I need market condition, maybe it's `market_volatility_index` (float).
        
        return True

    def evaluate(self, signal: Signal, context: Dict[str, float], severity: Severity) -> Decision:
        # Construct why_now
        why_now = [self.why_now_template.format(s=signal, c=context)]
        
        return Decision.create(
            signal=signal,
            context=context,
            severity=severity,
            why_now=why_now,
            recommended_actions=self.recommended_actions,
            confidence=1.0, # Rules are deterministic
            triggered_by=f"Rule: {self.signal.value}_{self.min_severity.value}"
        )

class DecisionMatrix:
    def __init__(self):
        self.rules: List[Rule] = []
        self._initialize_rules()

    def _initialize_rules(self):
        # 1. Covenant Breach -> Critical
        self.rules.append(Rule(
            signal=Signal.COVENANT_BREACH,
            min_severity=Severity.CRITICAL,
            recommended_actions=[
                "Initiate immediate waiver request",
                "Prepare equity cure analysis",
                "Freeze capital deployment"
            ],
            why_now_template="Critical covenant breach detected with high severity.",
            priority=1
        ))

        # 2. Risk Concentration
        self.rules.append(Rule(
            signal=Signal.RISK_CONCENTRATION,
            min_severity=Severity.HIGH,
            recommended_actions=[
                "Review sector allocation",
                "Hedging strategy assessment"
            ],
            why_now_template="Portfolio risk concentration exceeds safety limits.",
            priority=2
        ))
        
        # 3. Volatility Spike
        self.rules.append(Rule(
            signal=Signal.VOLATILITY_SPIKE,
            min_severity=Severity.MEDIUM,
            recommended_actions=[
                "Stress test portfolio",
                "Increase liquidity buffers"
            ],
            why_now_template="Market volatility spike detected.",
            priority=3
        ))

    def evaluate(self, signal: Signal, context: Dict[str, float], severity: Severity) -> Optional[Decision]:
        matched_rules = [r for r in self.rules if r.matches(signal, context, severity, "")]
        
        if not matched_rules:
            return None

        # Pick highest priority
        best_rule = min(matched_rules, key=lambda r: r.priority)
        return best_rule.evaluate(signal, context, severity)
