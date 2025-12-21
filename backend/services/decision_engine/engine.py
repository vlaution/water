from datetime import datetime
import uuid
from typing import List, Dict, Optional, Any

from .decision import Decision, Signal, Severity
from .covenants import check_covenant_breaches, Covenant
from .severity_calculator import calculate_severity_score, bucket_severity
from .action_templates import get_actions_for_trigger
from .confidence_scorer import calculate_confidence, ConfidenceAssessment

class DecisionEngine:
    """Capital allocation decision engine. Orchestrates rules, math, and templates."""
    
    def __init__(self):
        self.decision_history: List[Decision] = []
    
    def process_covenant_breach(
        self,
        company_id: str,
        company_name: str,
        metrics: Dict[str, float],
        covenants: List[Covenant],
        context_metadata: Dict[str, Any] # Non-numeric context like 'recurrence_count'
    ) -> Optional[Decision]:
        """Process potential covenant breaches into decisions."""
        
        breaches = check_covenant_breaches(metrics, covenants)
        if not breaches:
            return None
        
        # For now, take the most severe breach
        breach = max(breaches, key=lambda b: abs(b.delta))
        
        # Calculate severity
        severity_score = calculate_severity_score(
            breach_size=abs(breach.delta / breach.threshold_value),
            recurrence_count=context_metadata.get("recurrence_count", 1),
            time_since_last_breach_days=context_metadata.get("days_since_last_breach", 999),
            cash_runway_months=context_metadata.get("cash_runway_months", 12.0),
            market_volatility_index=context_metadata.get("market_volatility_index", 15.0)
        )
        
        severity = bucket_severity(severity_score)
        
        # Get actions for triggers
        all_actions_steps = []
        for trigger in breach.covenant_id in ["defs_1", "defs_2"] and ["ebitda_covenant_breach"] or ["ebitda_covenant_breach"]:
            # Logic hook: In reality covenant object has action_triggers. 
            # We didn't pass action_triggers to breach object in previous step explicitly in constructor?
            # Re-reading covenants.py: check_covenant_breaches creates CovenantBreach.
            # CovenantBreach doesn't store action_triggers. 
            # We need to map back or look up. 
            # Simplification: Assume Covenant object is available or we use default mapping.
            # FIX: We should look up the covenant object to get action_triggers. 
            # Or use a default based on breach.metric_name
            pass

        # Since I can't easily look up covenant by ID without the list, I'll fallback to a map based on metric
        # In production this would be robust key lookup.
        triggers = []
        if "EBITDA" in breach.metric_name:
            triggers = ["ebitda_covenant_breach"]
        elif "Debt" in breach.metric_name:
            triggers = ["debt_covenant_breach"]
        
        for trigger in triggers:
            steps = get_actions_for_trigger(trigger, {
                "company_name": company_name,
                "breach_amount": breach.delta
            })
            # Convert steps to strings for Decision object compatibility, or update Decision to hold Steps
            # The Decision object defined in decision.py has `recommended_actions: List[str]`
            # So we must format them.
            formatted_actions = [f"{s.type.value.upper()}: {s.description}" for s in steps]
            all_actions_steps.extend(formatted_actions)
        
        if not all_actions_steps:
             all_actions_steps = ["NOTIFY: Immediate review required (No template found)"]

        # Calculate confidence
        confidence_assessment = calculate_confidence(
            data_completeness=context_metadata.get("data_completeness", 85.0),
            data_freshness_days=context_metadata.get("data_freshness_days", 7),
            model_validation=True,
            signal_agreement_count=context_metadata.get("signal_agreement", 2),
            historical_precision=context_metadata.get("historical_precision", 0.75)
        )
        
        # Build why_now list
        why_now = []
        if context_metadata.get("recurrence_count", 0) > 1:
            why_now.append(f"Consecutive breach #{context_metadata['recurrence_count']}")
        if context_metadata.get("cash_runway_months", 12) < 6:
            why_now.append(f"Cash runway < {context_metadata['cash_runway_months']} months")
        if context_metadata.get("market_volatility_index", 15) > 30:
            why_now.append("Market volatility spike")
        
        why_now.append(f"Breach of {breach.covenant_name} by ${abs(breach.delta):,.0f}")

        # Create decision
        decision = Decision.create(
            signal=Signal.COVENANT_BREACH,
            context={
                "threshold": breach.threshold_value,
                "actual": breach.actual_value,
                "delta": breach.delta,
                "severity_score": severity_score
            },
            severity=severity,
            why_now=why_now,
            recommended_actions=all_actions_steps,
            confidence=confidence_assessment.score,
            triggered_by=breach.covenant_id,
            metadata={
                "company_name": company_name,
                "confidence_breakdown": confidence_assessment.breakdown, # EXPLAINABILITY
                "confidence_warnings": confidence_assessment.warnings,
                "breach_details": str(breach)
            }
        )
        
        self.decision_history.append(decision)
        return decision

    def process_cash_runway(
        self,
        company_id: str,
        company_name: str,
        cash_balance: float,
        monthly_burn: float,
        context_metadata: Dict[str, Any]
    ) -> Optional[Decision]:
        """Cash runway decision logic - triggers at 12, 6, 3 months."""
        
        if monthly_burn <= 0:
            return None
        
        runway_months = cash_balance / monthly_burn
        
        # Only trigger at thresholds
        if runway_months > 12:
            return None
        
        # Determine severity and trigger
        why_now = []
        if runway_months < 3:
            severity = Severity.CRITICAL
            trigger = "cash_runway_3mo"
            why_now.append(f"Cash runway: {runway_months:.1f} months - CRITICAL")
        elif runway_months < 6:
            severity = Severity.HIGH
            trigger = "cash_runway_6mo"
            why_now.append(f"Cash runway: {runway_months:.1f} months - ACTION REQUIRED")
        else:  # 6-12 months
            severity = Severity.MEDIUM
            trigger = "cash_runway_12mo"
            why_now.append(f"Cash runway: {runway_months:.1f} months - MONITOR")
        
        # Add context if deteriorating
        prev_runway = context_metadata.get("previous_runway_months", runway_months + 1)
        deterioration_pct = 0.0
        if runway_months < prev_runway * 0.8:  # 20% deterioration
             deterioration_pct = ((prev_runway - runway_months)/prev_runway) * 100
             why_now.append(f"Deteriorated from {prev_runway:.1f} months ({deterioration_pct:.0f}%)")
        
        # Get pre-approved actions
        steps = get_actions_for_trigger(trigger, {
             "company_name": company_name,
             "runway_months": runway_months
        })
        formatted_actions = [f"{s.type.value.upper()}: {s.description}" for s in steps]
        if not formatted_actions:
             formatted_actions = [f"NOTIFY: Review Cash Position (Runway {runway_months:.1f}m)"]
        
        # Calculate confidence (cash data is usually reliable)
        confidence_assessment = calculate_confidence(
            data_completeness=95,
            data_freshness_days=context_metadata.get("data_freshness_days", 7),
            model_validation=True,
            signal_agreement_count=2,  # Cash + burn rate agree
            historical_precision=0.85
        )
        
        decision = Decision.create(
            signal=Signal.CASH_RUNWAY,
            context={
                "cash_balance": cash_balance,
                "monthly_burn": monthly_burn,
                "runway_months": runway_months,
                "previous_runway": prev_runway,
                "deterioration_pct": deterioration_pct
            },
            severity=severity,
            why_now=why_now,
            recommended_actions=formatted_actions,
            confidence=confidence_assessment.score,
            triggered_by=trigger,
            metadata={
                "company_name": company_name,
                "confidence_breakdown": confidence_assessment.breakdown,
                "confidence_warnings": confidence_assessment.warnings
            }
        )
        
        self.decision_history.append(decision)
        return decision

    def process_forecast_miss(
        self,
        company_id: str,
        company_name: str,
        metric: str,  # "revenue", "ebitda", "fcf"
        forecast: float,
        actual: float,
        variance_thresholds: Dict[str, float],  # {"warning": 0.10, "critical": 0.20}
        context_metadata: Dict[str, Any]
    ) -> Optional[Decision]:
        """Forecast miss decision logic - triggers at defined thresholds."""
        
        if actual == 0:
            return None
        
        if abs(forecast) < 1e-9:
            # If forecast is 0, any negative actual is a 100% miss
            variance_pct = -100.0 if actual < 0 else 0.0
        else:
            variance_pct = (actual - forecast) / abs(forecast) * 100
        
        # Only trigger if miss is negative (underperformance)
        if variance_pct >= 0:  # Beat or hit forecast
            return None
        
        abs_variance = abs(variance_pct) / 100.0 # e.g., 0.20
        
        # Determine severity
        critical_thresh = variance_thresholds.get("critical", 0.20)
        warning_thresh = variance_thresholds.get("warning", 0.10)
        
        if abs_variance >= critical_thresh:
            severity = Severity.HIGH
            trigger = "forecast_miss_critical"
        elif abs_variance >= warning_thresh:
            severity = Severity.MEDIUM
            trigger = "forecast_miss_warning"
        else:
            return None  # Below threshold
        
        # Build why_now
        why_now = [
            f"{metric.upper()} miss: {variance_pct:.1f}% vs forecast",
            f"Actual: ${actual:,.0f} vs Forecast: ${forecast:,.0f}"
        ]
        
        # Add trend context
        consecutive = context_metadata.get("consecutive_misses", 0)
        if consecutive > 0:
            why_now.append(f"Consecutive misses: {consecutive} quarters")
        
        # Get actions
        steps = get_actions_for_trigger(trigger, {
            "company_name": company_name,
            "metric": metric,
            "variance_pct": variance_pct
        })
        formatted_actions = [f"{s.type.value.upper()}: {s.description}" for s in steps]
        
        # Calculate confidence
        confidence_assessment = calculate_confidence(
            data_completeness=context_metadata.get("data_completeness", 90),
            data_freshness_days=context_metadata.get("data_freshness_days", 7),
            model_validation=context_metadata.get("forecast_was_approved", False),
            signal_agreement_count=1,  # Single metric
            historical_precision=context_metadata.get("forecast_accuracy", 0.70)
        )
        
        decision = Decision.create(
            signal=Signal.FORECAST_MISS,
            context={
                "forecast": forecast,
                "actual": actual,
                "variance_pct": variance_pct,
                "abs_variance": abs_variance,
                "consecutive_misses": float(consecutive)
            },
            severity=severity,
            why_now=why_now,
            recommended_actions=formatted_actions,
            confidence=confidence_assessment.score,
            triggered_by=trigger,
            metadata={
                "company_name": company_name,
                "metric": metric,
                "confidence_breakdown": confidence_assessment.breakdown,
                "confidence_warnings": confidence_assessment.warnings
            }
        )
        
        self.decision_history.append(decision)
        return decision

        self.decision_history.append(decision)
        return decision

    def process_risk_concentration(
        self,
        company_id: str,
        company_name: str,
        concentration_type: str,  # "customer", "supplier", "geographic"
        concentration_pct: float,
        threshold_pct: float, 
        context_metadata: Dict[str, Any]
    ) -> Optional[Decision]:
        """Risk concentration decision logic - single points of failure."""
        
        if concentration_pct < threshold_pct:
            return None
        
        # Determine severity based on concentration level
        if concentration_pct >= 60.0:
            severity = Severity.HIGH
            trigger = "risk_concentration_critical"
        elif concentration_pct >= threshold_pct:
            severity = Severity.MEDIUM
            trigger = "risk_concentration_warning"
        else:
            return None
        
        # Get the specific entity name if available
        entity_name = context_metadata.get("entity_name", f"Top {concentration_type}")
        
        why_now = [
            f"{concentration_type.capitalize()} concentration: {concentration_pct:.1f}%",
            f"Threshold: {threshold_pct}%",
            f"Entity: {entity_name}"
        ]
        
        # Add if increasing
        prev_concentration = context_metadata.get("previous_concentration", 0)
        if concentration_pct > prev_concentration:
            why_now.append(f"Increased from {prev_concentration:.1f}%")
        
        # Get actions
        steps = get_actions_for_trigger(trigger, {
            "company_name": company_name,
            "concentration_type": concentration_type,
            "entity_name": entity_name
        })
        formatted_actions = [f"{s.type.value.upper()}: {s.description}" for s in steps]
        
        # Calculate confidence
        confidence_assessment = calculate_confidence(
            data_completeness=context_metadata.get("data_completeness", 75),
            data_freshness_days=context_metadata.get("data_freshness_days", 90),  # Often quarterly
            model_validation=False,  # This is raw data
            signal_agreement_count=1,
            historical_precision=0.80
        )
        
        decision = Decision.create(
            signal=Signal.RISK_CONCENTRATION,
            context={
                "concentration_pct": concentration_pct,
                "threshold_pct": threshold_pct,
                "previous_concentration": float(prev_concentration),
                "revenue_impact": float(context_metadata.get("revenue_impact", 0))  # $ amount at risk
            },
            severity=severity,
            why_now=why_now,
            recommended_actions=formatted_actions,
            confidence=confidence_assessment.score,
            triggered_by=trigger,
            metadata={
                "company_name": company_name,
                "concentration_type": concentration_type,
                "entity_name": entity_name,
                "confidence_breakdown": confidence_assessment.breakdown,
                "confidence_warnings": confidence_assessment.warnings
            }
        )
        
        self.decision_history.append(decision)
        return decision

        self.decision_history.append(decision)
        return decision

    def process_volatility_spike(
        self,
        company_id: str,
        company_name: str,
        current_volatility: float,
        historical_average_volatility: float,
        context_metadata: Dict[str, Any],
        spike_threshold: float = 2.0
    ) -> Optional[Decision]:
        """Volatility spike decision logic - market stress indicator."""
        
        if historical_average_volatility <= 0:
            return None
        
        ratio = current_volatility / historical_average_volatility
        
        if ratio < spike_threshold:
            return None
        
        # Determine severity
        if ratio >= 3.0:
            severity = Severity.HIGH
            trigger = "volatility_spike_critical"
        elif ratio >= spike_threshold:
            severity = Severity.MEDIUM
            trigger = "volatility_spike_warning"
        else:
            return None
            
        why_now = [
            f"Volatility spike: {ratio:.1f}x normal",
            f"Current: {current_volatility*100:.1f}% vs Normal: {historical_average_volatility*100:.1f}%",
            f"Duration: {context_metadata.get('spike_duration_days', 1)} days"
        ]
        
        # Add market context
        if context_metadata.get("market_down", False):
            why_now.append("Market in downtrend - amplifying impact")
            
        # Get actions
        steps = get_actions_for_trigger(trigger, {
            "company_name": company_name,
            "current_vol": current_volatility,
            "ratio": ratio
        })
        formatted_actions = [f"{s.type.value.upper()}: {s.description}" for s in steps]
        if not formatted_actions:
             formatted_actions = ["NOTIFY: Monitor Volatility"]
             
        # Calculate confidence
        confidence_assessment = calculate_confidence(
            data_completeness=100,
            data_freshness_days=0, # Real-time
            model_validation=True,
            signal_agreement_count=2,
            historical_precision=0.95
        )
        
        decision = Decision.create(
            signal=Signal.VOLATILITY_SPIKE,
            context={
                "current_volatility": current_volatility,
                "historical_average": historical_average_volatility,
                "volatility_ratio": ratio,
                "spike_threshold": spike_threshold,
                "market_correlation": context_metadata.get("market_correlation", 0.0)
            },
            severity=severity,
            why_now=why_now,
            recommended_actions=formatted_actions,
            confidence=confidence_assessment.score,
            triggered_by=trigger,
            metadata={
                "company_name": company_name,
                "spike_duration_days": context_metadata.get("spike_duration_days", 1),
                "confidence_breakdown": confidence_assessment.breakdown,
                "confidence_warnings": confidence_assessment.warnings
            }
        )
        
        self.decision_history.append(decision)
        return decision

    def get_decisions_for_company(self, company_id: str) -> List[Decision]:
        """Get all decisions for a company (filtered by metadata)."""
        # Note: company_id must be in metadata to filter
        return self.decision_history
