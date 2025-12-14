"""
Script to create a test user for login testing
Run with: python create_test_user.py
"""
import sys
sys.path.insert(0, '.')

from backend.database.models import SessionLocal, User, init_db
from backend.auth.jwt_handler import get_password_hash

def create_test_user():
    init_db()
    db = SessionLocal()
    
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == "test@example.com").first()
        if existing:
            print(f"User already exists: {existing.email}")
            return
        
        # Create test user
        hashed_password = get_password_hash("password123")
        user = User(
            email="test@example.com",
            password=hashed_password,
            name="Test User"
        )
        db.add(user)
        db.commit()
        print(f"Created test user: test@example.com / password123")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
