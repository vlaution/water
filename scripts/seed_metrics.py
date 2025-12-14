from backend.database.models import SessionLocal, SystemMetric, ValuationMetric, User
from datetime import datetime, timedelta
import random

def seed_metrics():
    db = SessionLocal()
    try:
        print("Seeding metrics...")
        
        # Seed Users if needed
        user = db.query(User).first()
        if not user:
            user = User(email="test@example.com", name="Test User", role="admin")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Seed System Metrics
        endpoints = ["/api/valuation/dcf", "/api/valuation/comps", "/api/auth/login"]
        for _ in range(20):
            metric = SystemMetric(
                timestamp=datetime.utcnow(),
                endpoint=random.choice(endpoints),
                method="POST",
                response_time_ms=random.randint(50, 500),
                status_code=200,
                user_id=user.id
            )
            db.add(metric)
            
        # Seed Valuation Metrics
        methods = ["DCF", "Comps", "LBO"]
        for _ in range(10):
            metric = ValuationMetric(
                valuation_id=f"val_{random.randint(1000, 9999)}",
                method_type=random.choice(methods),
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow(),
                duration_ms=random.randint(1000, 5000),
                cache_hit=random.choice([True, False]),
                input_complexity_score=random.randint(1, 10),
                user_id=user.id
            )
            db.add(metric)
            
        db.commit()
        print("✅ Seeded 20 system metrics and 10 valuation metrics.")
        
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_metrics()
