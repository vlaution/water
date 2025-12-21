from datetime import datetime
from typing import Dict, List
from .decision import Decision, DecisionState, Severity

class DecisionMonitor:
    def reassess_decision(self, decision: Decision, current_metrics: Dict) -> Decision:
        """Re-evaluate a decision based on latest data."""
        old_state = decision.state
        updated = False
        new_state = None
        reason = ""
        
        # Rule 1: If metrics improved 20% past threshold, auto-resolve
        if self._condition_improved(decision, current_metrics):
            new_state = DecisionState.RESOLVED
            reason = "Condition improved past threshold"
            updated = True
        
        # Rule 2: If critical for 7 days with no action, escalate
        elif (decision.severity == Severity.CRITICAL and 
              decision.state == DecisionState.ACTIVE and
              (datetime.utcnow() - decision.timestamp).days > 7):
            new_state = DecisionState.ESCALATED
            reason = "Critical decision ignored for 7+ days"
            updated = True
        
        # Rule 3: If medium severity for 30 days, auto-resolve as stale
        elif (decision.severity == Severity.MEDIUM and
              (datetime.utcnow() - decision.timestamp).days > 30):
            new_state = DecisionState.RESOLVED
            reason = "Medium severity stale after 30 days"
            updated = True
            
        if updated and new_state:
            decision.state = new_state
            decision.state_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "from": old_state.value,
                "to": new_state.value,
                "reason": reason
            })
        
        return decision

    def _condition_improved(self, decision: Decision, current_metrics: Dict) -> bool:
        """
        Check if the condition has improved significantly.
        This requires comparing current_metrics against the original decision context.
        """
        # Placeholder: In a real system, we would check the specific signal type
        # and compare current values against the threshold.
        # For now, we return False to be safe.
        return False
