"""
SSO Service for handling Single Sign-On authentication with multiple providers.
Supports OIDC-compliant providers like Google, Okta, and Azure AD.
"""
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from backend.database.models import SSOConfiguration
import os
import requests
from urllib.parse import urlencode
from backend.database.redis_client import redis_client

class SSOService:
    """Service for managing SSO configurations and OIDC flows."""
    
    def __init__(self):
        """Initialize SSO service with encryption key."""
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # Generate a key for development (in production, this MUST be in env)
            encryption_key = Fernet.generate_key()
            print(f"WARNING: Using generated encryption key. Set ENCRYPTION_KEY in production!")
        
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()
        
        self.cipher = Fernet(encryption_key)
    
    def encrypt_secret(self, secret: str) -> bytes:
        """Encrypt a client secret."""
        return self.cipher.encrypt(secret.encode())
    
    def decrypt_secret(self, encrypted: bytes) -> str:
        """Decrypt a client secret."""
        return self.cipher.decrypt(encrypted).decode()
    
    def get_config(self, provider: str, db: Session) -> Optional[SSOConfiguration]:
        """
        Get SSO configuration for a provider.
        
        Args:
            provider: Provider name ('google', 'okta', 'azure_ad')
            db: Database session
            
        Returns:
            SSOConfiguration or None if not found
        """
        return db.query(SSOConfiguration).filter(
            SSOConfiguration.provider == provider
        ).first()
    
    def get_login_url(self, provider: str, db: Session) -> str:
        """
        Generate the SSO login URL for redirecting to IdP.
        
        Args:
            provider: Provider name
            db: Database session
            
        Returns:
            Authorization URL
        """
        # Check if SSO is enabled
        if os.getenv("ENABLE_SSO", "true").lower() != "true":
             raise ValueError("SSO is currently disabled.")

        config = self.get_config(provider, db)
        if not config:
            raise ValueError(f"SSO configuration not found for provider: {provider}")
        
        # OIDC authorization endpoint
        auth_endpoint = f"{config.issuer_url}/authorize"
        
        state = self._generate_state()
        # Verify Redis is available
        if not redis_client.client:
             raise ValueError("Redis unavailable. Cannot perform secure SSO.")
        
        # Store state with 10 minute expiry (CSRF protection)
        redis_client.set(f"sso_state:{state}", "valid", ex=600)

        params = {
            "client_id": config.client_id,
            "redirect_uri": config.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state 
        }
        
        return f"{auth_endpoint}?{urlencode(params)}"
    
    def exchange_code(self, provider: str, code: str, state: str, db: Session) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            provider: Provider name
            code: Authorization code from IdP
            state: CSRF state parameter to verify
            db: Database session
            
        Returns:
            Token response from IdP
        """
        # 1. Verify State (CSRF Protection)
        stored_state = redis_client.get(f"sso_state:{state}")
        if not stored_state:
            raise ValueError("Invalid SOC/CSRF state parameter. Potential attack detected or session expired.")
        
        # Delete state after use (one-time use)
        redis_client.delete(f"sso_state:{state}")

        config = self.get_config(provider, db)
        if not config:
            raise ValueError(f"SSO configuration not found for provider: {provider}")
        
        token_endpoint = f"{config.issuer_url}/token"
        client_secret = self.decrypt_secret(config.client_secret)
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": config.redirect_uri,
            "client_id": config.client_id,
            "client_secret": client_secret
        }
        
        response = requests.post(token_endpoint, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def get_user_info(self, provider: str, access_token: str, db: Session) -> Dict[str, Any]:
        """
        Get user information from IdP using access token.
        
        Args:
            provider: Provider name
            access_token: Access token from IdP
            db: Database session
            
        Returns:
            User info from IdP
        """
        config = self.get_config(provider, db)
        if not config:
            raise ValueError(f"SSO configuration not found for provider: {provider}")
        
        userinfo_endpoint = f"{config.issuer_url}/userinfo"
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(userinfo_endpoint, headers=headers)
        response.raise_for_status()
        
        return response.json()
    
    def _generate_state(self) -> str:
        """Generate a random state parameter for CSRF protection."""
        import secrets
        return secrets.token_urlsafe(32)
