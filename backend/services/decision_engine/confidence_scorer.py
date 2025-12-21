from dataclasses import dataclass, field
from typing import Dict, List

@dataclass(frozen=True)
class ConfidenceAssessment:
    score: float # 0.0 to 1.0
    rating: str  # "High", "Moderate", "Low"
    breakdown: Dict[str, float] # Component scores for transparency
    warnings: List[str] # Specific actionable warnings

def calculate_confidence(
    data_completeness: float,      # % of required data points available (0-100)
    data_freshness_days: int,      # Days since latest data point
    model_validation: bool,        # Has model been backtested?
    signal_agreement_count: int,   # How many independent signals agree? 
    historical_precision: float    # Historical accuracy of this signal type (0.0 - 1.0)
) -> ConfidenceAssessment:
    """
    Compute confidence score 0-1 based on objective factors.
    Returns detailed assessment with transparency.
    """
    
    # 1. Data Completeness (Max 0.3)
    # 100% complete -> 0.3
    completeness_score = (min(data_completeness, 100.0) / 100.0) * 0.3
    
    # 2. Data Freshness (Max 0.25)
    warnings = []
    if data_freshness_days <= 7:
        freshness_score = 0.25
    elif data_freshness_days <= 30:
        freshness_score = 0.20
    elif data_freshness_days <= 90:
        freshness_score = 0.10
        warnings.append(f"Data is {data_freshness_days} days old (stale).")
    else:
        freshness_score = 0.05
        warnings.append(f"Data is {data_freshness_days} days old (very stale).")
    
    # 3. Model Validation (Max 0.20)
    if model_validation:
        validation_score = 0.20
    else:
        validation_score = 0.05
        warnings.append("Model has not been backtested.")
    
    # 4. Signal Agreement (Max 0.15)
    # 3+ signals -> 0.15. Clamped.
    agreement_score = (min(signal_agreement_count, 3) / 3.0) * 0.15
    if signal_agreement_count < 2:
        warnings.append("Low signal agreement (isolated signal).")
    
    # 5. Historical Precision (Max 0.10)
    precision_score = min(historical_precision, 1.0) * 0.10
    
    total_score = round(
        completeness_score +
        freshness_score +
        validation_score +
        agreement_score +
        precision_score, 
        2
    )
    
    # Determine Rating
    if total_score < 0.6:
        rating = "Low"
        warnings.append("Decision based on partial/weak data. Verify with primary sources.")
    elif total_score < 0.8:
        rating = "Moderate"
        warnings.append("Moderate confidence. Consider additional validation.")
    else:
        rating = "High"
        
    return ConfidenceAssessment(
        score=total_score,
        rating=rating,
        breakdown={
            "completeness": round(completeness_score, 2),
            "freshness": round(freshness_score, 2),
            "validation": round(validation_score, 2),
            "agreement": round(agreement_score, 2),
            "precision": round(precision_score, 2)
        },
        warnings=warnings
    )
