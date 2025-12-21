import pytest
from backend.services.decision_engine import (
    decision_engine_service,
    Signal,
    Severity,
    Decision,
    Covenant,
    check_covenant_breaches,
    calculate_severity_score,
    bucket_severity,
    get_actions_for_trigger,
    ActionType,
    calculate_confidence,
    ConfidenceAssessment,
    DecisionEngine
)

# ... (Previous tests omitted for brevity, keeping only new Integration test) ...

def test_decision_engine_orchestrator():
    # 1. Setup Engine
    engine = DecisionEngine()
    
    # 2. Setup Company Data
    company_name = "TechFlow Corp"
    metrics = {
        "EBITDA": 4000000.0,    # $4M
        "Debt/EBITDA": 5.5      # High leverage
    }
    
    # 3. Setup Covenants
    covenants = [
        Covenant(
            id="cov_1", name="EBITDA Min", metric="EBITDA", 
            threshold=5000000.0, # Expecting >$5M
            direction="below", grace_period_days=30, action_triggers=["ebitda_covenant_breach"]
        )
    ]
    
    # 4. Setup Context Metadata (for scoring)
    context_meta = {
        "recurrence_count": 2,          # 2nd time -> higher severity
        "cash_runway_months": 5.0,      # <6mo -> higher severity
        "market_volatility_index": 25.0,
        "data_completeness": 90.0,
        "data_freshness_days": 2
    }
    
    # 5. Execute
    decision = engine.process_covenant_breach(
        company_id="techflow_123",
        company_name=company_name,
        metrics=metrics,
        covenants=covenants,
        context_metadata=context_meta
    )
    
    # 6. Verify Decision
    assert decision is not None
    assert decision.signal == Signal.COVENANT_BREACH
    assert decision.severity in [Severity.HIGH, Severity.CRITICAL]
    
    # Check Explainability
    assert decision.metadata["confidence_breakdown"]["completeness"] > 0
    assert "Consecutive breach #2" in decision.why_now
    assert "Cash runway < 5.0 months" in decision.why_now
    
    # Check Actions
    assert len(decision.recommended_actions) > 0
    assert "NOTIFY: Notify Debt committee within 24 hours" in decision.recommended_actions[0] # From template specific text
