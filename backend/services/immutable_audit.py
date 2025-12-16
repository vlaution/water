import hashlib
import json
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select
from backend.database.models import AuditLog

class ImmutableAuditService:
    def __init__(self, session: Session):
        self.session = session

    def log_event_cryptographic(self, user_id: str, action: str, resource_type: str, resource_id: str, details: dict = None) -> AuditLog:
        """
        Creates an audit log entry that is cryptographically linked to the previous entry.
        """
        # 1. Get Previous Hash
        last_entry = self._get_last_entry()
        previous_hash = last_entry.hash if last_entry and last_entry.hash else "0" * 64

        # 2. Prepare Block Data
        timestamp = datetime.now()
        
        details_json = None
        if details:
            details_json = json.dumps(details) if isinstance(details, dict) else str(details)
        
        entry = AuditLog(
            user_id=user_id,
            action_type=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details_json or "{}",
            timestamp=timestamp,
            previous_hash=previous_hash,
            nonce=0
        )

        # 3. Mine the Block (Proof of Work)
        # We find a nonce such that hash starts with '00' (difficulty tunable)
        self._mine_block(entry)

        # 4. Save to DB
        self.session.add(entry)
        self.session.commit()
        self.session.refresh(entry)
        
        return entry

    def get_history(self, resource_id: str = None) -> List[AuditLog]:
        """
        Retrieves the audit chain. 
        Optionally filters by resource_id (though chained integrity is global).
        """
        statement = select(AuditLog).order_by(AuditLog.id.asc())
        if resource_id:
            statement = statement.where(AuditLog.resource_id == resource_id)
        return self.session.execute(statement).scalars().all()

    def verify_chain_integrity(self) -> dict:
        """
        Iterates through the entire chain and verifies hashes and links.
        Returns validation status and any broken blocks.
        """
        entries = self.session.execute(select(AuditLog).order_by(AuditLog.id)).scalars().all()
        if not entries:
            return {"status": "valid", "count": 0}

        broken_blocks = []
        
        # Verify Genesis Block (if exists) or first link
        # For simplicity, we just loop from index 1 (if index 0 is genesis)
        # But actually we should verify every block's internal hash vs its content
        
        for i, entry in enumerate(entries):
            # 1. Verify internal hash integrity
            calculated_hash = self._calculate_hash(entry)
            if calculated_hash != entry.hash:
                broken_blocks.append({
                    "id": entry.id, 
                    "issue": "Content altered (Hash mismatch)",
                    "expected": calculated_hash,
                    "actual": entry.hash
                })
                continue

            # 2. Verify Chain Linkage (except first block)
            if i > 0:
                previous_entry = entries[i-1]
                if entry.previous_hash != previous_entry.hash:
                     broken_blocks.append({
                        "id": entry.id,
                        "issue": "Chain broken (Previous Hash mismatch)",
                        "expected_prev": previous_entry.hash,
                        "actual_prev": entry.previous_hash
                    })

        if broken_blocks:
            return {"status": "compromised", "broken_blocks": broken_blocks}
        
        return {"status": "valid", "count": len(entries), "last_hash": entries[-1].hash}

    def _get_last_entry(self) -> Optional[AuditLog]:
        statement = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
        return self.session.execute(statement).scalars().first()

    def _mine_block(self, entry: AuditLog, difficulty: int = 2):
        """
        Simple Proof of Work.
        Increment nonce until hash starts with '0' * difficulty.
        """
        prefix = '0' * difficulty
        while True:
            entry_hash = self._calculate_hash(entry)
            if entry_hash.startswith(prefix):
                entry.hash = entry_hash
                return
            entry.nonce += 1

    def _calculate_hash(self, entry: AuditLog) -> str:
        """
        SHA-256(index + timestamp + user + action + resource + prev_hash + nonce)
        """
        # Ensure consistent serialization
        if isinstance(entry.details, str):
            details_str = entry.details
        else:
            details_str = json.dumps(entry.details, sort_keys=True) if entry.details else "{}"
        # Note: We must use the exact string representation of timestamp used in DB or convert properly
        # Ideally, use timestamp.isoformat() but ensure it matches what was stored/retrieved
        ts_str = entry.timestamp.isoformat()
        
        block_content = f"{entry.user_id}{entry.action_type}{entry.resource_id}{details_str}{ts_str}{entry.previous_hash}{entry.nonce}"
        return hashlib.sha256(block_content.encode()).hexdigest()
