from sqlalchemy.orm import Session
from backend.database.models import HistoricalTransaction
from typing import Dict, Any, List

class HistoricalDataService:
    def __init__(self, db: Session):
        self.db = db

    def get_benchmarks(self, sector: str) -> Dict[str, Any]:
        """
        Get benchmark statistics for a specific sector.
        """
        # Case-insensitive match if possible, or exact
        query = self.db.query(HistoricalTransaction).filter(HistoricalTransaction.sector == sector)
        transactions = query.all()
        
        if not transactions:
            return {}
            
        # Calculate stats
        ev_ebitdas = [t.ev_ebitda for t in transactions]
        leverages = [t.leverage_ratio for t in transactions]
        irrs = [t.irr for t in transactions if t.irr is not None]
        success_count = sum(1 for t in transactions if t.success_status == "Exited")
        
        return {
            "count": len(transactions),
            "ev_ebitda": {
                "mean": sum(ev_ebitdas) / len(ev_ebitdas),
                "min": min(ev_ebitdas),
                "max": max(ev_ebitdas)
            },
            "leverage": {
                "mean": sum(leverages) / len(leverages),
                "max": max(leverages)
            },
            "irr": {
                "mean": sum(irrs) / len(irrs) if irrs else 0.0,
                "median": sorted(irrs)[len(irrs)//2] if irrs else 0.0
            },
            "success_rate": success_count / len(transactions) if transactions else 0.0
        }

    def seed_defaults(self):
        """
        Populate DB with dummy data if empty.
        """
        if self.db.query(HistoricalTransaction).first():
            return
            
        data = [
            {"sector": "Technology", "year": 2020, "ev_ebitda": 12.5, "leverage_ratio": 5.5, "irr": 0.28, "success_status": "Exited"},
            {"sector": "Technology", "year": 2019, "ev_ebitda": 11.0, "leverage_ratio": 5.0, "irr": 0.25, "success_status": "Exited"},
            {"sector": "Technology", "year": 2021, "ev_ebitda": 15.0, "leverage_ratio": 6.0, "irr": 0.35, "success_status": "Exited"},
            {"sector": "Technology", "year": 2022, "ev_ebitda": 10.0, "leverage_ratio": 4.0, "irr": 0.15, "success_status": "Holding"},
            {"sector": "Technology", "year": 2018, "ev_ebitda": 10.5, "leverage_ratio": 4.5, "irr": 0.22, "success_status": "Exited"},
            
            {"sector": "Healthcare", "year": 2020, "ev_ebitda": 14.0, "leverage_ratio": 5.0, "irr": 0.22, "success_status": "Exited"},
            {"sector": "Healthcare", "year": 2021, "ev_ebitda": 16.0, "leverage_ratio": 5.5, "irr": 0.25, "success_status": "Exited"},
            {"sector": "Healthcare", "year": 2019, "ev_ebitda": 13.0, "leverage_ratio": 4.8, "irr": 0.20, "success_status": "Exited"},
            
            {"sector": "Industrial", "year": 2020, "ev_ebitda": 8.0, "leverage_ratio": 4.5, "irr": 0.18, "success_status": "Exited"},
            {"sector": "Industrial", "year": 2021, "ev_ebitda": 9.0, "leverage_ratio": 5.0, "irr": 0.20, "success_status": "Exited"},
            {"sector": "Industrial", "year": 2019, "ev_ebitda": 7.5, "leverage_ratio": 4.0, "irr": 0.16, "success_status": "Exited"},
        ]
        
        for item in data:
            self.db.add(HistoricalTransaction(**item))
        self.db.commit()
