from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import json
from sqlalchemy.orm import Session
from dataclasses import asdict

# Import Decision Engine
from backend.services.decision_engine import DecisionEngine, Covenant, Decision
from backend.database.models import DecisionRecord, Company
# In a real app we might load default covenants from a config file or DB
from backend.services.decision_engine.covenants import Covenant

class AlertChannel:
    def send(self, title: str, message: str, level: str = "info"):
        raise NotImplementedError

class ConsoleChannel(AlertChannel):
    def send(self, title: str, message: str, level: str = "info"):
        print(f"[{level.upper()}] ALERT: {title} - {message}")

class AlertService:
    def __init__(self, db_session_factory=None):
        self.channels: List[AlertChannel] = [ConsoleChannel()]
        self.decision_engine = DecisionEngine()
        self.db_session_factory = db_session_factory # e.g. SessionLocal
        
        # System thresholds (legacy)
        self.p95_threshold_ms = int(os.getenv("ALERT_P95_THRESHOLD_MS", 5000))
        self.error_rate_threshold = float(os.getenv("ALERT_ERROR_RATE_THRESHOLD", 0.05))

    def process_financial_alert(self, alert_payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Process a functional/business alert through the Decision Engine.
        This upgrades a raw 'alert' into a 'decision'.
        """
        alert_type = alert_payload.get("type")
        company_id = alert_payload.get("company_id")
        company_name = alert_payload.get("company_name", "Unknown Company")
        
        # Hydrate Company if needed for logic (some paths use ID)
        company = db.query(Company).filter(Company.ticker == company_id).first()
        if company:
            company_name = company.name
        elif not company and alert_type != "system_alert": 
             # If strictly financial, we might want to error, but for resilience we proceed if enough info
             pass

        decision = None
        
        # Route to appropriate decision processor
        if alert_type == "Covenant Impact" or alert_type == "covenant_breach" or alert_type == "covenant_breach_check":
             # Hydrate Covenants for this check
             # TODO: Load real covenants from DB. Mocking for integration:
             covenants = [
                  Covenant(id="default_ebitda", name="EBITDA Min", metric="EBITDA", threshold=5000000, direction="below", grace_period_days=30, action_triggers=["ebitda_covenant_breach"]),
                  Covenant(id="default_debt", name="Debt/EBITDA Max", metric="Debt/EBITDA", threshold=4.5, direction="above", grace_period_days=15, action_triggers=["debt_covenant_breach"])
             ]
             decision = self.decision_engine.process_covenant_breach(
                 company_id=company_id,
                 company_name=company_name,
                 metrics=alert_payload.get("metrics", {}),
                 covenants=covenants,
                 context_metadata=alert_payload.get("context", {})
             )
        
        elif alert_type == "cash_burn" or alert_type == "Cash Runway":
            decision = self.decision_engine.process_cash_runway(
                company_id=company_id,
                company_name=company_name,
                cash_balance=alert_payload.get("cash_balance", 0.0),
                monthly_burn=alert_payload.get("monthly_burn", 0.0),
                context_metadata=alert_payload.get("context", {})
            )
        
        elif alert_type == "forecast_miss" or alert_type == "Forecast Variance":
            decision = self.decision_engine.process_forecast_miss(
                company_id=company_id,
                company_name=company_name,
                metric=alert_payload.get("metric", "revenue"),
                forecast=alert_payload.get("forecast", 0.0),
                actual=alert_payload.get("actual", 0.0),
                variance_thresholds=alert_payload.get("thresholds", {"warning": 0.10, "critical": 0.20}),
                context_metadata=alert_payload.get("context", {})
            )
        
        elif alert_type == "risk_concentration" or alert_type == "Concentration Risk":
            decision = self.decision_engine.process_risk_concentration(
                company_id=company_id,
                company_name=company_name,
                concentration_type=alert_payload.get("concentration_type", "customer"),
                concentration_pct=alert_payload.get("concentration_pct", 0.0),
                threshold_pct=alert_payload.get("threshold_pct", 40.0),
                context_metadata=alert_payload.get("context", {})
            )
        
        elif alert_type == "volatility_spike" or alert_type == "Market Volatility":
            decision = self.decision_engine.process_volatility_spike(
                company_id=company_id,
                company_name=company_name,
                current_volatility=alert_payload.get("current_volatility", 0.0),
                historical_average_volatility=alert_payload.get("normal_volatility", 0.0),
                spike_threshold=alert_payload.get("spike_threshold", 2.0),
                context_metadata=alert_payload.get("context", {})
            )

        if decision:
            # Persist Decision
            record = DecisionRecord(
                decision_id=decision.decision_id,
                company_id=company_id,
                signal=decision.signal.value,
                severity=decision.severity.value,
                confidence=decision.confidence,
                recommended_actions_json=json.dumps(decision.recommended_actions),
                why_now_json=json.dumps(decision.why_now),
                context_json=json.dumps(decision.context),
                metadata_json=json.dumps(decision.metadata),
                triggered_by=decision.triggered_by
            )
            db.add(record)
            db.commit()
            
            # Notify Channels (High Severity only?)
            self._notify(
                title=f"Decision Generated: {decision.signal.value}", 
                message=f"Created decision {decision.decision_id} for {company_name}. Severity: {decision.severity.value}", 
                level=decision.severity.value
            )
            
            return {
                "status": "decision_created",
                "decision": asdict(decision),
                "original_alert_id": alert_payload.get("id")
            }
            
        return {
            "status": "suppressed", 
            "reason": "No decision threshold met",
            "original_alert": alert_payload
        }

    def check_system_metrics(self, metrics_summary: Dict[str, Any]):
        """Legacy system health check."""
        # ... (Existing logic kept for backward compatibility)
        alerts = []
        p95 = metrics_summary.get('p95_response_time', 0)
        if p95 > self.p95_threshold_ms:
            alerts.append({'title': 'High Latency', 'message': f'{p95}ms', 'level': 'warning'})
            
        error_rate = metrics_summary.get('error_rate', 0)
        if error_rate > self.error_rate_threshold:
            alerts.append({'title': 'High Errors', 'message': f'{error_rate:.1%}', 'level': 'critical'})

        for a in alerts:
            self._notify(a['title'], a['message'], a['level'])

    def _notify(self, title: str, message: str, level: str):
        for channel in self.channels:
            try:
                channel.send(title, message, level)
            except Exception as e:
                print(f"Error sending alert: {e}")

# Global instance (requires DB at runtime for process_financial_alert)
alert_service = AlertService()
