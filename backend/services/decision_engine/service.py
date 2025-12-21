from typing import Dict, Optional
from .decision import Decision, Signal, Severity
from .matrix import DecisionMatrix

class DecisionEngineService:
    def __init__(self):
        self.matrix = DecisionMatrix()

    def determine_action(self, signal: Signal, context: Dict[str, float], severity: Severity) -> Optional[Decision]:
        """
        Core function to determine the next best action based on inputs.
        """
        return self.matrix.evaluate(signal, context, severity)

# Global Instance
decision_engine_service = DecisionEngineService()
