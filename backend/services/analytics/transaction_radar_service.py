from typing import List, Optional
from pydantic import BaseModel
from datetime import date, timedelta

class TransactionDeal(BaseModel):
    id: str
    date: str
    target: str
    acquirer: str
    value_mm: float
    ev_ebitda: float
    sector: str
    deal_type: str # "LBO", "Strategic", "Merger"

class MarketAlert(BaseModel):
    id: str
    date: str
    severity: str # "High", "Medium", "Low"
    title: str
    description: str
    related_tickers: List[str]

class TransactionRadarService:
    def get_recent_transactions(self, sector: Optional[str] = None, limit: int = 10) -> List[TransactionDeal]:
        """
        Returns a list of recent M&A transactions.
        """
        # Mock data - would typically come from a financial data provider
        deals = [
            TransactionDeal(
                id="txn_001", date="2024-03-15", target="CloudScale Inc", acquirer="TechGiant Corp",
                value_mm=2500.0, ev_ebitda=14.5, sector="Technology", deal_type="Strategic"
            ),
            TransactionDeal(
                id="txn_002", date="2024-03-12", target="MediCare Plus", acquirer="HealthFund PE",
                value_mm=850.0, ev_ebitda=11.2, sector="Healthcare", deal_type="LBO"
            ),
            TransactionDeal(
                id="txn_003", date="2024-03-10", target="GreenEnergy Sol", acquirer="PowerGrid Ltd",
                value_mm=1200.0, ev_ebitda=9.8, sector="Energy", deal_type="Strategic"
            ),
            TransactionDeal(
                id="txn_004", date="2024-03-08", target="ConsumerGoods Co", acquirer="Retail Partners",
                value_mm=450.0, ev_ebitda=8.5, sector="Consumer", deal_type="LBO"
            ),
            TransactionDeal(
                id="txn_005", date="2024-03-05", target="IndusMachinery", acquirer="Global Mfg",
                value_mm=3200.0, ev_ebitda=10.5, sector="Industrials", deal_type="Strategic"
            ),
            TransactionDeal(
                id="txn_006", date="2024-03-01", target="CyberSafe", acquirer="SecureNet",
                value_mm=600.0, ev_ebitda=16.0, sector="Technology", deal_type="Strategic"
            ),
        ]
        
        if sector:
            deals = [d for d in deals if d.sector == sector]
            
        return deals[:limit]

    def get_deal_alerts(self) -> List[MarketAlert]:
        """
        Returns high-priority market alerts.
        """
        return [
            MarketAlert(
                id="alert_001", date=str(date.today()), severity="High",
                title="Rising Interest Rates Impact",
                description="Fed signals potential rate hike next month. LBO financing costs may increase by 25-50bps.",
                related_tickers=["SPY", "HYG"]
            ),
            MarketAlert(
                id="alert_002", date=str(date.today() - timedelta(days=2)), severity="Medium",
                title="Tech Sector Valuation Compression",
                description="SaaS multiples have compressed by 1.5x on average over the last quarter.",
                related_tickers=["IGV", "CLOU"]
            ),
            MarketAlert(
                id="alert_003", date=str(date.today() - timedelta(days=5)), severity="Low",
                title="Healthcare M&A Activity Spike",
                description="Increased deal flow in mid-market healthcare services.",
                related_tickers=["XLV"]
            )
        ]

transaction_radar_service = TransactionRadarService()
