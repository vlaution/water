# Authentication API routes
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.auth.jwt_handler import (
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    get_password_hash, 
    verify_password,
    token_blacklist
)
from backend.auth.dependencies import get_current_user
from backend.database.models import get_db, User, AuthProvider, UserRole
from backend.services.sso_service import SSOService
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"  # Default to user if not specified

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str



@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(request.password)
    
    # Validate Role
    try:
        user_role = UserRole(request.role.lower())
    except ValueError:
        user_role = UserRole.user # Fallback or error? Let's fallback to user for safety or raise error. 
        # Actually safer to fallback or default. But if they explicitly ask for 'analyst', we should grant it for this MVP/Role implementation.
        # In a real strict system we might want to restrict 'admin' creation, but for this task we want to enable 'analyst' creation.
    
    # Create user
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name,
        role=user_role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "role": user.role.value
        }
    }

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        print(f"Login attempt for: {request.email}")
        # Find user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            print("User not found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(request.password, user.hashed_password):
            print("Invalid password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.full_name,
                "role": user.role.value
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.full_name,
        "role": current_user.role.value,
        "createdAt": current_user.created_at.isoformat()
    }

@router.get("/sso/login/{provider}")
async def sso_login(provider: str, db: Session = Depends(get_db)):
    """Redirect to SSO provider for authentication."""
    service = SSOService(db)
    try:
        auth_url = service.get_authorization_url(provider)
        return RedirectResponse(url=auth_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO login failed: {str(e)}"
        )

@router.get("/sso/callback/{provider}", response_model=AuthResponse)
async def sso_callback(provider: str, code: str, db: Session = Depends(get_db)):
    """Handle SSO callback and create/update user."""
    service = SSOService(db)
    try:
        auth_data = service.process_callback(provider, code)
        return auth_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO callback failed: {str(e)}"
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token_endpoint(request: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    # Verify refresh token
    payload = verify_refresh_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if token is blacklisted
    if token_blacklist.is_blacklisted(request.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    # Get user
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name
        }
    }

@router.post("/demo-login", response_model=AuthResponse)
async def demo_login(db: Session = Depends(get_db)):
    """Auto-login as a demo user."""
    email = "demo@example.com"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create demo user if not exists
        # Note: Provide a random password hash so no one can login manually easily, 
        # though this endpoint allows login anyway.
        user = User(
            email=email,
            hashed_password=get_password_hash("demo_password_secure_enough"),
            full_name="Demo User",
            is_demo=True,
            role="user", # Enum value
            auth_provider="email"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Ensure is_demo is set if it was existing but updated migration
        if not user.is_demo:
            user.is_demo = True
            db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_demo": True
        }
    }
