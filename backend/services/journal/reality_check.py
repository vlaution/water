from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import DecisionRecord, AcknowledgementRecord
import json
import os

def get_decisions_between(db: Session, start_date: datetime, end_date: datetime) -> List[DecisionRecord]:
    return db.query(DecisionRecord).filter(
        DecisionRecord.created_at >= start_date,
        DecisionRecord.created_at <= end_date
    ).all()

def calculate_alignment(decision: DecisionRecord) -> str:
    """Determine if outcome aligned with prediction."""
    if not decision.actual_outcome:
        return "PENDING"
    
    # Simple logic: CRITICAL decisions should have negative outcomes if strictly predictive,
    # BUT if we intervened (Action Taken), we might have AVOIDED the negative outcome.
    # This logic checks if the "Reality" matches the "Signal Type".
    # For now, following user spec: CRITICAL -> Expect Negative Outcome if ignored?
    # User Spec: "CRITICAL decisions should have negative outcomes" => YES/NO
    if decision.severity == "CRITICAL":
        return "YES" if decision.actual_outcome in ["DEFAULT", "DILUTION", "FIRE_SALE"] else "NO"
    
    return "TBD"

def should_tune(decision: DecisionRecord) -> bool:
    # If High Confidence but Poor Alignment -> Tune
    if decision.confidence > 0.8 and calculate_alignment(decision) == "NO":
        return True
    return False

def generate_weekly_reality_check(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
    """Generate the weekly 'Decisions Fired vs Reality' report."""
    
    decisions = get_decisions_between(db, start_date, end_date)
    
    # Pre-fetch acknowledgements if needed (or rely on decision.state/acknowledgement_hash)
    # Since DecisionRecord now has state, we can use that.
    
    report = {
        "report_period": f"{start_date.date()} to {end_date.date()}",
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_decisions": len(decisions),
            "critical_decisions": sum(1 for d in decisions if d.severity == "CRITICAL"),
            "acknowledged": sum(1 for d in decisions if d.state in ["acknowledged", "resolved", "overridden"]), # inferred from state
            "with_outcomes": sum(1 for d in decisions if d.actual_outcome is not None)
        },
        "decisions_table": []
    }
    
    for decision in decisions:
        # Fetch detailed acknowledgement if needed
        ack = None
        if decision.acknowledgement_hash:
             ack = db.query(AcknowledgementRecord).filter(AcknowledgementRecord.signature_hash == decision.acknowledgement_hash).first()

        row = {
            "decision_id": decision.decision_id,
            "signal": decision.signal,
            "company": decision.company_id,
            "fired_at": decision.created_at.isoformat(),
            "severity": decision.severity,
            "confidence": decision.confidence,
            "recommended_action": json.loads(decision.recommended_actions_json)[0] if decision.recommended_actions_json else "N/A",
            "human_response": decision.state if decision.state != "active" else "PENDING",
            "response_rationale": ack.rationale if ack else "",
            "response_lag_hours": round((ack.timestamp - decision.created_at).total_seconds() / 3600, 1) if ack else "N/A",
            "actual_outcome": decision.actual_outcome or "TBD",
            "outcome_aligned": calculate_alignment(decision),
            "tuning_required": should_tune(decision)
        }
        report["decisions_table"].append(row)
    
    # Save as markdown for readability
    report_dir = "reports/weekly"
    os.makedirs(report_dir, exist_ok=True)
    report_path = f"{report_dir}/{start_date.date()}_reality_check.md"
    
    save_report_as_markdown(report, report_path)
    
    return report

def save_report_as_markdown(report: Dict, path: str):
    md = f"# Weekly Reality Check: {report['report_period']}\n\n"
    md += f"**Generated At**: {report['generated_at']}\n\n"
    
    md += "## Summary\n"
    for k, v in report['summary'].items():
        md += f"- **{k.replace('_', ' ').title()}**: {v}\n"
    
    md +=("\n## Decisions Table\n")
    md +=("| ID | Signal | Severity | Response | Lag (Hrs) | Rationale | Alignment |\n")
    md +=("|---|---|---|---|---|---|---|\n")
    
    for row in report['decisions_table']:
        rationale_snippet = (row['response_rationale'][:30] + '...') if len(row['response_rationale']) > 30 else row['response_rationale']
        md += f"| {row['decision_id'][:8]} | {row['signal']} | {row['severity']} | {row['human_response']} | {row['response_lag_hours']} | {rationale_snippet} | {row['outcome_aligned']} |\n"
        
    with open(path, "w") as f:
        f.write(md)
