from sqlalchemy import Column, String, DateTime, Text, Integer, Float, create_engine, Enum, LargeBinary, ForeignKey, Boolean, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import enum

Base = declarative_base()

# ... (existing enums and classes)

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"
    viewer = "viewer"
    analyst = "analyst"
    manager = "manager"

class AuthProvider(str, enum.Enum):
    email = "email"
    google = "google"
    okta = "okta"
    azure = "azure"

class Company(Base):
    __tablename__ = 'companies'

    ticker = Column(String(20), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), index=True, nullable=False) # e.g. Technology
    industry = Column(String(100), nullable=True) # e.g. Semiconductors
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.user)
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.email)
    external_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ValuationRun(Base):
    __tablename__ = 'valuation_runs'

    id = Column(String(36), primary_key=True, index=True)
    company_name = Column(String(255), index=True)
    mode = Column(String(50)) # 'manual' or 'upload'
    input_data = Column(Text) # JSON string
    results = Column(Text) # JSON string
    user_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    action_type = Column(String(50), nullable=False, index=True) # e.g., 'LOGIN', 'EXPORT_DATA'
    resource_type = Column(String(50), nullable=True) # e.g., 'valuation', 'report'
    resource_id = Column(String(100), nullable=True) # e.g., '123', '456'
    before_state = Column(Text, nullable=True) # JSON snapshot before change
    after_state = Column(Text, nullable=True) # JSON snapshot after change
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True) # Additional JSON details


class IndustryNorm(Base):
    __tablename__ = 'industry_norms'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sector = Column(String(100), index=True, nullable=False)
    metric = Column(String(100), nullable=False)
    mean = Column(Float, nullable=False)
    std_dev = Column(Float, nullable=False)
    percentile_25 = Column(Float, nullable=True)
    percentile_75 = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_industry_sector_metric', 'sector', 'metric'),
    )

class ValidationPattern(Base):
    __tablename__ = 'validation_patterns'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pattern_type = Column(String(100), nullable=False, index=True) # e.g., "growth_margin_mismatch"
    condition_json = Column(Text, nullable=False) # JSON logic
    severity = Column(String(20), nullable=False) # "warning", "critical"
    message_template = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserFeedback(Base):
    __tablename__ = 'user_feedback'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    anomaly_field = Column(String(100), nullable=False, index=True)
    user_action = Column(String(50), nullable=False) # "accept", "dismiss", "correct"
    correction_value = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    context_data = Column(Text, nullable=True) # Optional JSON context

class ValuationMetric(Base):
    __tablename__ = 'valuation_metrics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    valuation_id = Column(String(100), index=True)
    method_type = Column(String(50))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer)
    cache_hit = Column(Boolean, default=False)
    input_complexity_score = Column(Integer)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserDashboardConfig(Base):
    __tablename__ = 'user_dashboard_configs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, index=True)
    config_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SSOConfiguration(Base):
    __tablename__ = 'sso_configurations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(50), unique=True, nullable=False)
    client_id = Column(String(255), nullable=False)
    client_secret = Column(String(255), nullable=False)
    redirect_uri = Column(String(255), nullable=False)
    issuer_url = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

class SystemMetric(Base):
    __tablename__ = 'system_metrics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint = Column(String(255), index=True)
    method = Column(String(10), index=True)
    response_time_ms = Column(Integer)
    status_code = Column(Integer)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    ip_address = Column(String(64)) # Hashed IP
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class HistoricalTransaction(Base):
    __tablename__ = 'historical_transactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sector = Column(String(100), index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    deal_size_m = Column(Float, nullable=True)
    ev_ebitda = Column(Float, nullable=False)
    leverage_ratio = Column(Float, nullable=False) # Total Debt / EBITDA
    equity_contribution_percent = Column(Float, nullable=True)
    irr = Column(Float, nullable=True) # Realized IRR
    moic = Column(Float, nullable=True)
    success_status = Column(String(50)) # "Exited", "Bankrupt", "Holding"
    region = Column(String(50), default="North America")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_hist_sector_year', 'sector', 'year'),
    )

# Database setup
# Database setup
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./valuation_v2.db")
# Using local SQLite explicitly as the configured Postgres instance is unreachable
DATABASE_URL = "sqlite:///./valuation_v2.db"

print(f"DEBUG: Raw DATABASE_URL: '{DATABASE_URL}'")

if DATABASE_URL:
    # Strip quotes and whitespace
    DATABASE_URL = DATABASE_URL.strip().strip('"').strip("'")
    
    # Fix for Prisma-style and legacy connection strings
    if DATABASE_URL.startswith("prisma+postgres://"):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("prisma+postgres://"):]
    elif DATABASE_URL.startswith("prisma.postgres://"):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("prisma.postgres://"):]
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("postgres://"):]
    
    # Clean up unsupported query parameters for psycopg2 (like api_key)
    if "?" in DATABASE_URL:
        from urllib.parse import urlparse, parse_qs, urlunparse, urlencode
        parsed = urlparse(DATABASE_URL)
        query_params = parse_qs(parsed.query)
        # Remove prisma-specific params that confuse psycopg2 or generic SQLAlchemy usage
        params_to_remove = ['api_key'] 
        for param in params_to_remove:
            if param in query_params:
                del query_params[param]
        
        # Rebuild URL
        new_query = urlencode(query_params, doseq=True)
        DATABASE_URL = urlunparse(parsed._replace(query=new_query))

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
