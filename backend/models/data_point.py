from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

class DataSource(Enum):
    FRED = "Federal Reserve Economic Data"
    SEC_XBRL = "SEC EDGAR XBRL"
    ALPHA_VANTAGE = "Alpha Vantage (Market Context Only)"
    MANUAL_UPLOAD = "Analyst Weekly Upload"
    INTERNAL = "Internal Portfolio System"

@dataclass
class DataPoint:
    value: float
    source: DataSource
    timestamp: datetime
    freshness_hours: int
    authority_level: str  # "REGULATORY", "MARKET", "INTERNAL"
    citation_url: str = ""  # Link to source
