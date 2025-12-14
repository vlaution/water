import json
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.database.models import SessionLocal, ValuationRun, User, UserRole, AuthProvider

def seed_data():
    db = SessionLocal()
    try:
        # Create a demo user if not exists
        demo_user = db.query(User).filter(User.email == "demo@example.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@example.com",
                name="Demo User",
                auth_provider=AuthProvider.local,
                role=UserRole.manager,
                password="password123" # In real app, hash this
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"Created demo user: {demo_user.email}")

        companies = [
            # 1. Tech / SaaS
            {
                "name": "CloudSync Inc.",
                "sector": "Technology",
                "industry": "SaaS - Collaboration Tools",
                "revenue": 85000000,
                "growth": 0.45,
                "margin": -0.12,
                "stage": "Late Stage",
                "runway": 15.0, # $150M cash / $10M burn (inferred)
                "dq": 95,
                "red_flags": [],
                "ev": 1200000000
            },
            {
                "name": "DataLens AI",
                "sector": "Technology",
                "industry": "AI/ML Analytics",
                "revenue": 22000000,
                "growth": 1.80,
                "margin": -0.45,
                "stage": "Growth",
                "runway": 8.0, # Inferred
                "dq": 85,
                "red_flags": ["High Burn Rate (> 50% of Rev)"],
                "ev": 350000000
            },
            # 2. Healthcare / Biotech
            {
                "name": "NeuraLink Therapeutics",
                "sector": "Healthcare",
                "industry": "Biotech - Neuroscience",
                "revenue": 0,
                "growth": 0.0,
                "margin": 0.0, # Pre-revenue
                "stage": "Series B",
                "runway": 25.0, # $150M / $6M
                "dq": 90,
                "red_flags": [],
                "ev": 450000000 # Inferred from typical Series B biotech
            },
            {
                "name": "MediScan Robotics",
                "sector": "Healthcare",
                "industry": "Medical Devices",
                "revenue": 145000000,
                "growth": 0.32,
                "margin": 0.18,
                "stage": "Late Stage",
                "runway": 99.0, # Profitable
                "dq": 98,
                "red_flags": [],
                "ev": 2100000000
            },
            # 3. Consumer
            {
                "name": "EcoWear",
                "sector": "Consumer Cyclical",
                "industry": "Sustainable Apparel",
                "revenue": 65000000,
                "growth": 0.75,
                "margin": 0.08,
                "stage": "Growth",
                "runway": 18.0,
                "dq": 88,
                "red_flags": [],
                "ev": 400000000
            },
            {
                "name": "FreshFuel",
                "sector": "Consumer Staples",
                "industry": "Food & Beverage",
                "revenue": 120000000,
                "growth": 0.40,
                "margin": 0.05,
                "stage": "Late Stage",
                "runway": 24.0,
                "dq": 92,
                "red_flags": [],
                "ev": 600000000
            },
            # 4. Industrial
            {
                "name": "Quantum Materials",
                "sector": "Industrials",
                "industry": "Advanced Materials",
                "revenue": 18000000,
                "growth": 1.20,
                "margin": -0.25,
                "stage": "Series A",
                "runway": 12.0,
                "dq": 80,
                "red_flags": [],
                "ev": 200000000
            },
            {
                "name": "SolarGrid Solutions",
                "sector": "Industrials",
                "industry": "Renewable Energy",
                "revenue": 320000000,
                "growth": 0.28,
                "margin": 0.14,
                "stage": "Late Stage",
                "runway": 99.0,
                "dq": 96,
                "red_flags": [],
                "ev": 1800000000
            },
            # 5. Financial
            {
                "name": "BlockChain Capital",
                "sector": "Financial Services",
                "industry": "Fintech / Digital Assets",
                "revenue": 42000000,
                "growth": 3.00,
                "margin": 0.35,
                "stage": "Growth",
                "runway": 99.0,
                "dq": 85,
                "red_flags": [],
                "ev": 500000000
            },
            {
                "name": "RiskMetrics Analytics",
                "sector": "Financial Services",
                "industry": "Financial Data & Analytics",
                "revenue": 480000000,
                "growth": 0.15,
                "margin": 0.32,
                "stage": "Late Stage",
                "runway": 99.0,
                "dq": 99,
                "red_flags": [],
                "ev": 4200000000
            }
        ]

        # Clear existing valuations for a clean slate (optional, maybe dangerous in prod but fine for demo)
        # db.query(ValuationRun).delete()
        # db.commit()

        for co in companies:
            # Check if exists
            existing = db.query(ValuationRun).filter(ValuationRun.company_name == co["name"]).first()
            if existing:
                print(f"Skipping {co['name']}, already exists.")
                continue

            # Construct Input Data
            input_data = {
                "dcf_input": {
                    "historical": {
                        "industry": co["industry"], # Used for correlation/concentration
                        "cash_balance": 10000000 if co["runway"] < 99 else 50000000, # Mock
                        "founded_year": 2018 # Mock
                    },
                    "projections": {
                        "revenue_start": co["revenue"],
                        "revenue_growth_start": co["growth"],
                        "ebitda_margin_start": co["margin"]
                    }
                }
            }

            # Construct Results
            results = {
                "enterprise_value": co["ev"],
                "equity_value": co["ev"] * 0.95, # Mock debt
                "dcf_valuation": {
                    "enterprise_value": co["ev"]
                }
            }

            val_run = ValuationRun(
                id=str(uuid.uuid4()),
                company_name=co["name"],
                mode="manual",
                input_data=json.dumps(input_data),
                results=json.dumps(results),
                user_id=demo_user.id,
                created_at=datetime.utcnow()
            )
            db.add(val_run)
            print(f"Added {co['name']}")

        db.commit()
        print("✅ Demo data seeded successfully!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
