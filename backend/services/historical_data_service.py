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
        # 1. Seed Transactions
        if not self.db.query(HistoricalTransaction).first():
            data = [
                {"sector": "Technology", "year": 2020, "ev_ebitda": 12.5, "leverage_ratio": 5.5, "irr": 0.28, "success_status": "Exited", "deal_size_m": 500.0},
                {"sector": "Technology", "year": 2019, "ev_ebitda": 11.0, "leverage_ratio": 5.0, "irr": 0.25, "success_status": "Exited", "deal_size_m": 400.0},
                {"sector": "Technology", "year": 2021, "ev_ebitda": 15.0, "leverage_ratio": 6.0, "irr": 0.35, "success_status": "Exited", "deal_size_m": 800.0},
                {"sector": "Technology", "year": 2022, "ev_ebitda": 10.0, "leverage_ratio": 4.0, "irr": 0.15, "success_status": "Holding", "deal_size_m": 600.0},
                {"sector": "Technology", "year": 2018, "ev_ebitda": 10.5, "leverage_ratio": 4.5, "irr": 0.22, "success_status": "Exited", "deal_size_m": 350.0},
                
                {"sector": "Healthcare", "year": 2020, "ev_ebitda": 14.0, "leverage_ratio": 5.0, "irr": 0.22, "success_status": "Exited", "deal_size_m": 450.0},
                {"sector": "Healthcare", "year": 2021, "ev_ebitda": 16.0, "leverage_ratio": 5.5, "irr": 0.25, "success_status": "Exited", "deal_size_m": 550.0},
                {"sector": "Healthcare", "year": 2019, "ev_ebitda": 13.0, "leverage_ratio": 4.8, "irr": 0.20, "success_status": "Exited", "deal_size_m": 420.0},
                
                {"sector": "Industrial", "year": 2020, "ev_ebitda": 8.0, "leverage_ratio": 4.5, "irr": 0.18, "success_status": "Exited", "deal_size_m": 300.0},
                {"sector": "Industrial", "year": 2021, "ev_ebitda": 9.0, "leverage_ratio": 5.0, "irr": 0.20, "success_status": "Exited", "deal_size_m": 350.0},
                {"sector": "Industrial", "year": 2019, "ev_ebitda": 7.5, "leverage_ratio": 4.0, "irr": 0.16, "success_status": "Exited", "deal_size_m": 280.0},
            ]
            
            for item in data:
                self.db.add(HistoricalTransaction(**item))
            self.db.commit()
        
        # 2. Seed Historical Market Snapshots (for Backtesting)
        from backend.database.models import MarketSnapshot
        from datetime import datetime
        import json
        
        # Check if snapshots exist
        if not self.db.query(MarketSnapshot).first():
            # Mock historical rates & multiples
            snapshot_data = [
                {
                    "date": datetime(2020, 6, 15), # 2020 (COVID dip/recovery)
                    "risk_free_rate": 0.007, # 0.7%
                    "corporate_spread_bbb": 0.025,
                    "high_yield_spread": 0.06,
                    "sector_leverage_multiples": json.dumps({"Technology": 5.5, "Healthcare": 5.0, "Industrial": 4.5}),
                    "sector_exit_multiples": json.dumps({"Technology": 12.0, "Healthcare": 13.0, "Industrial": 8.0})
                },
                {
                    "date": datetime(2021, 6, 15), # 2021 (Peak)
                    "risk_free_rate": 0.015, # 1.5%
                    "corporate_spread_bbb": 0.015,
                    "high_yield_spread": 0.035,
                    "sector_leverage_multiples": json.dumps({"Technology": 6.5, "Healthcare": 6.0, "Industrial": 5.5}),
                    "sector_exit_multiples": json.dumps({"Technology": 15.0, "Healthcare": 16.0, "Industrial": 10.0})
                },
                {
                    "date": datetime(2022, 6, 15), # 2022 (Rate Hikes)
                    "risk_free_rate": 0.03, # 3.0%
                    "corporate_spread_bbb": 0.02,
                    "high_yield_spread": 0.05,
                    "sector_leverage_multiples": json.dumps({"Technology": 4.5, "Healthcare": 5.0, "Industrial": 4.0}),
                    "sector_exit_multiples": json.dumps({"Technology": 10.0, "Healthcare": 12.0, "Industrial": 7.5})
                },
                 {
                    "date": datetime(2019, 6, 15), # 2019 (Pre-COVID)
                    "risk_free_rate": 0.02, 
                    "corporate_spread_bbb": 0.018,
                    "high_yield_spread": 0.04,
                    "sector_leverage_multiples": json.dumps({"Technology": 5.0, "Healthcare": 5.2, "Industrial": 4.2}),
                    "sector_exit_multiples": json.dumps({"Technology": 11.0, "Healthcare": 13.0, "Industrial": 8.5})
                }
            ]
            
            for snap in snapshot_data:
                self.db.add(MarketSnapshot(**snap))
            self.db.commit()
