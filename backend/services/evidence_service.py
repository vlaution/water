from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from backend.database.models import EvidenceAttachment, ReviewComment

class EvidenceService:
    def __init__(self, session: Session):
        self.session = session

    def add_attachment(self, valuation_id: str, file_path: Optional[str] = None, source_url: Optional[str] = None, description: str = "") -> EvidenceAttachment:
        """
        Records a new evidence attachment (screenshot or link).
        """
        attachment = EvidenceAttachment(
            valuation_id=valuation_id,
            file_path=file_path,
            source_url=source_url,
            description=description,
            uploaded_by=1 # Mock user ID for now
        )
        self.session.add(attachment)
        self.session.commit()
        self.session.refresh(attachment)
        return attachment

    def get_attachments(self, valuation_id: str) -> List[EvidenceAttachment]:
        """
        Retrieves all evidence for a valuation.
        """
        stmt = select(EvidenceAttachment).where(EvidenceAttachment.valuation_id == valuation_id)
        return self.session.execute(stmt).scalars().all()

    def add_comment(self, valuation_id: str, text: str, user_id: int = 1, parent_id: Optional[int] = None) -> ReviewComment:
        """
        Adds a woven comment for review.
        """
        comment = ReviewComment(
            valuation_id=valuation_id,
            text=text,
            user_id=user_id,
            parent_id=parent_id,
            status="open"
        )
        self.session.add(comment)
        self.session.commit()
        self.session.refresh(comment)
        return comment

    def get_comments(self, valuation_id: str) -> List[ReviewComment]:
        """
        Retrieves comments (flat list, frontend can tree-ify).
        """
        stmt = select(ReviewComment).where(ReviewComment.valuation_id == valuation_id).order_by(ReviewComment.created_at)
        return self.session.execute(stmt).scalars().all()
