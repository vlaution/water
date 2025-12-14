# Authentication utilities
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib

# Secret key for JWT (in production, use environment variable)
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"

# Password hashing - use argon2 to avoid bcrypt compatibility issues
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Token doesn't expire (as requested by user)
        expire = datetime.utcnow() + timedelta(days=36500)  # ~100 years
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=30)  # 30 days default
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode a refresh token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

class TokenBlacklist:
    """In-memory token blacklist for MVP. Replace with Redis in production."""
    
    def __init__(self):
        self.blacklisted = set()  # Set of (token_hash, expires_at) tuples
    
    def add(self, token: str, expires_at: datetime):
        """Add a token to the blacklist."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        self.blacklisted.add((token_hash, expires_at))
    
    def is_blacklisted(self, token: str) -> bool:
        """Check if a token is blacklisted."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        # Clean up expired tokens
        self.blacklisted = {(h, exp) for h, exp in self.blacklisted if exp > datetime.utcnow()}
        # Check if token is blacklisted
        return any(h == token_hash for h, exp in self.blacklisted)

# Global blacklist instance
token_blacklist = TokenBlacklist()
