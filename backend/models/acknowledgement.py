from dataclasses import dataclass, field
from datetime import datetime
from typing import List
import hashlib

@dataclass
class Acknowledgement:
    decision_id: str
    user_id: str
    user_role: str  # "Partner", "Analyst", "CFO"
    action: str  # "ACKNOWLEDGED", "OVERRIDDEN", "ESCALATED"
    rationale: str  # Mandatory free-text reason
    timestamp: datetime
    evidence_attachments: List[str] = field(default_factory=list)  # Links to docs
    
    # Cryptographic hash for immutability
    signature_hash: str = field(init=False)
    
    def __post_init__(self):
        # Create a content string to hash (ensures integrity of the core fields)
        content = f"{self.decision_id}{self.user_id}{self.action}{self.timestamp.isoformat()}{self.rationale}"
        self.signature_hash = hashlib.sha256(content.encode()).hexdigest()
