import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database.models import SessionLocal, Company, engine, Base

def seed_companies():
    # Ensure table exists
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    companies = [
        # Technology
        {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics"},
        {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology", "industry": "Software - Infrastructure"},
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology", "industry": "Semiconductors"},
        {"ticker": "AMD", "name": "Advanced Micro Devices", "sector": "Technology", "industry": "Semiconductors"},
        {"ticker": "INTC", "name": "Intel Corporation", "sector": "Technology", "industry": "Semiconductors"},
        {"ticker": "CRM", "name": "Salesforce, Inc.", "sector": "Technology", "industry": "Software - Application"},
        {"ticker": "ADBE", "name": "Adobe Inc.", "sector": "Technology", "industry": "Software - Infrastructure"},
        {"ticker": "ORCL", "name": "Oracle Corporation", "sector": "Technology", "industry": "Software - Infrastructure"},
        {"ticker": "CSCO", "name": "Cisco Systems, Inc.", "sector": "Technology", "industry": "Communication Equipment"},
        
        # Communication Services
        {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services", "industry": "Internet Content & Information"},
        {"ticker": "META", "name": "Meta Platforms, Inc.", "sector": "Communication Services", "industry": "Internet Content & Information"},
        {"ticker": "NFLX", "name": "Netflix, Inc.", "sector": "Communication Services", "industry": "Entertainment"},
        {"ticker": "DIS", "name": "The Walt Disney Company", "sector": "Communication Services", "industry": "Entertainment"},
        
        # Consumer Cyclical
        {"ticker": "AMZN", "name": "Amazon.com, Inc.", "sector": "Consumer Cyclical", "industry": "Internet Retail"},
        {"ticker": "TSLA", "name": "Tesla, Inc.", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers"},
        {"ticker": "HD", "name": "Home Depot, Inc.", "sector": "Consumer Cyclical", "industry": "Home Improvement Retail"},
        {"ticker": "MCD", "name": "McDonald's Corporation", "sector": "Consumer Cyclical", "industry": "Restaurants"},
        {"ticker": "NKE", "name": "Nike, Inc.", "sector": "Consumer Cyclical", "industry": "Footwear & Accessories"},
        
        # Financial Services
        {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financial Services", "industry": "Banks - Diversified"},
        {"ticker": "BAC", "name": "Bank of America Corporation", "sector": "Financial Services", "industry": "Banks - Diversified"},
        {"ticker": "GS", "name": "The Goldman Sachs Group", "sector": "Financial Services", "industry": "Capital Markets"},
        {"ticker": "MS", "name": "Morgan Stanley", "sector": "Financial Services", "industry": "Capital Markets"},
        {"ticker": "V", "name": "Visa Inc.", "sector": "Financial Services", "industry": "Credit Services"},
        {"ticker": "MA", "name": "Mastercard Incorporated", "sector": "Financial Services", "industry": "Credit Services"},
        
        # Healthcare
        {"ticker": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare", "industry": "Drug Manufacturers - General"},
        {"ticker": "LLY", "name": "Eli Lilly and Company", "sector": "Healthcare", "industry": "Drug Manufacturers - General"},
        {"ticker": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare", "industry": "Drug Manufacturers - General"},
        {"ticker": "UNH", "name": "UnitedHealth Group", "sector": "Healthcare", "industry": "Healthcare Plans"},
        
        # Energy
        {"ticker": "XOM", "name": "Exxon Mobil Corporation", "sector": "Energy", "industry": "Oil & Gas Integrated"},
        {"ticker": "CVX", "name": "Chevron Corporation", "sector": "Energy", "industry": "Oil & Gas Integrated"},
        
        # Industrials
        {"ticker": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials", "industry": "Farm & Heavy Construction Machinery"},
        {"ticker": "BA", "name": "The Boeing Company", "sector": "Industrials", "industry": "Aerospace & Defense"},
        {"ticker": "GE", "name": "General Electric Company", "sector": "Industrials", "industry": "Specialty Industrial Machinery"},
    ]
    
    print(f"Seeding {len(companies)} companies...")
    
    added = 0
    updated = 0
    
    for c in companies:
        existing = db.query(Company).filter(Company.ticker == c["ticker"]).first()
        if existing:
            existing.name = c["name"]
            existing.sector = c["sector"]
            existing.industry = c["industry"]
            updated += 1
        else:
            new_company = Company(**c)
            db.add(new_company)
            added += 1
    
    db.commit()
    db.close()
    print(f"✅ Seeding complete. Added: {added}, Updated: {updated}")

if __name__ == "__main__":
    seed_companies()
