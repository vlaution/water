from sqlalchemy import Column, String, DateTime, Text, Integer, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ValuationRun(Base):
    __tablename__ = "valuation_runs"
    
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    company_name = Column(String, nullable=False)
    mode = Column(String, nullable=False)  # 'upload' or 'manual'
    input_data = Column(Text, nullable=False)  # JSON string
    results = Column(Text, nullable=False)  # JSON string
    user_id = Column(Integer, nullable=True)  # Foreign key to User (nullable for migration)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./valuation_v2.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
