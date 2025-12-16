from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select
from backend.database.models import Regulation, RegulatoryAlert
# Mock Feed Data
MOCK_FEED = [
    {
        "name": "ASC 820 Update",
        "agency": "FASB",
        "text": "New guidance on crypto asset valuation.",
        "version": "2024.2",
        "effective_date": datetime(2025, 1, 1)
    }
]

class RegulatoryService:
    def __init__(self, session: Session):
        self.session = session

    def fetch_updates(self):
        """
        Polls for updates and ingests them.
        """
        # In real app, perform HTTP GET to RSS/API
        updates = MOCK_FEED
        
        new_regs = []
        for item in updates:
            # Check if exists
            exists = self.session.execute(
                select(Regulation).where(
                    Regulation.name == item["name"],
                    Regulation.version == item["version"]
                )
            ).scalars().first()
            
            if not exists:
                reg = Regulation(
                    name=item["name"],
                    agency=item["agency"],
                    text=item["text"],
                    version=item["version"],
                    effective_date=item["effective_date"]
                )
                self.session.add(reg)
                self.session.commit()
                self.session.refresh(reg)
                
                # Create Alert
                self._create_alert(reg)
                new_regs.append(reg)
        
        return new_regs

    def _create_alert(self, reg: Regulation):
        # Determine severity (mock logic)
        severity = "medium"
        if "ASC 820" in reg.name:
            severity = "critical"
            
        alert = RegulatoryAlert(
            regulation_id=reg.id,
            severity=severity,
            description=f"New Regulation Ingested: {reg.name} ({reg.version})"
        )
        self.session.add(alert)
        self.session.commit()

    def get_alerts(self, unread_only: bool = False) -> List[RegulatoryAlert]:
        stmt = select(RegulatoryAlert).order_by(RegulatoryAlert.created_at.desc())
        if unread_only:
            stmt = stmt.where(RegulatoryAlert.is_read == False)
        return self.session.execute(stmt).scalars().all()
