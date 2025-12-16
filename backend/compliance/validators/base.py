import abc
from typing import Dict, Any, List
from backend.models.compliance import ComplianceResult

class BaseValidator(abc.ABC):
    """
    Abstract Base Class for all compliance validators.
    """
    
    @property
    @abc.abstractmethod
    def name(self) -> str:
        pass

    @property
    @abc.abstractmethod
    def weight(self) -> float:
        """Impact of this validator on the total risk score."""
        pass

    @abc.abstractmethod
    def validate(self, valuation_data: Dict[str, Any]) -> ComplianceResult:
        """
        Run the validation logic.
        """
        pass
    
    def _create_result(self, status: str, risk_score: float, details: List[str]) -> ComplianceResult:
        return ComplianceResult(
            validator_name=self.name,
            status=status,
            risk_score=risk_score,
            details=details,
            weight=self.weight
        )
