import requests
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from backend.database.models import User, SSOConfiguration, AuthProvider
from backend.auth.jwt_handler import create_access_token
from datetime import datetime
import json
import base64

class SSOService:
    def __init__(self, db: Session):
        self.db = db

    def get_config(self, provider: str) -> Optional[SSOConfiguration]:
        return self.db.query(SSOConfiguration).filter(SSOConfiguration.provider == provider).first()

    def get_authorization_url(self, provider: str) -> str:
        config = self.get_config(provider)
        if not config:
            raise ValueError(f"SSO configuration for {provider} not found")

        # Construct OIDC Auth URL
        # Note: This is a simplified generic OIDC construction. 
        # Specific providers might need slight tweaks (e.g. 'audience' for Auth0)
        params = {
            "client_id": config.client_id,
            "redirect_uri": config.redirect_uri,
            "response_type": "code",
            "scope": "openid profile email",
            "state": "random_state_string", # In prod, use secure random & verify
        }
        
        # Determine base auth endpoint from issuer (simplified discovery)
        # Ideally we'd fetch .well-known/openid-configuration
        auth_endpoint = f"{config.issuer_url}/v1/authorize" if "okta" in config.issuer_url else f"{config.issuer_url}/authorize"
        if "accounts.google.com" in config.issuer_url:
             auth_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{auth_endpoint}?{query_string}"

    def process_callback(self, provider: str, code: str) -> Dict:
        config = self.get_config(provider)
        if not config:
            raise ValueError(f"SSO configuration for {provider} not found")

        # 1. Exchange Code for Token
        token_endpoint = f"{config.issuer_url}/v1/token" if "okta" in config.issuer_url else f"{config.issuer_url}/token"
        if "accounts.google.com" in config.issuer_url:
             token_endpoint = "https://oauth2.googleapis.com/token"

        # Decrypt client secret (simplified for MVP - assuming stored plain or handled elsewhere)
        # In real prod, use proper encryption service
        client_secret = config.client_secret.decode('utf-8') if isinstance(config.client_secret, bytes) else config.client_secret

        payload = {
            "grant_type": "authorization_code",
            "client_id": config.client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": config.redirect_uri
        }

        response = requests.post(token_endpoint, data=payload)
        if response.status_code != 200:
            raise ValueError(f"Failed to exchange token: {response.text}")

        tokens = response.json()
        id_token = tokens.get("id_token")
        
        # 2. Decode ID Token to get User Info
        # In prod, verify signature using JWKS from issuer
        user_info = self._decode_jwt_payload(id_token)
        
        return self._get_or_create_sso_user(user_info, provider)

    def _decode_jwt_payload(self, token: str) -> Dict:
        # Unsafe decode for MVP - verifies structure but not signature
        # Production MUST verify signature
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        
        padding = '=' * (4 - len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(parts[1] + padding))

    def _get_or_create_sso_user(self, user_info: Dict, provider: str) -> Dict:
        email = user_info.get("email")
        if not email:
            raise ValueError("Email not found in ID token")

        user = self.db.query(User).filter(User.email == email).first()
        
        if user:
            # Update existing user
            # user.last_sso_sync = datetime.utcnow() # Assuming we uncomment this field
            pass
            # user.external_id = user_info.get("sub") # Optional: link if not linked
        else:
            # Provision new user
            user = User(
                email=email,
                name=user_info.get("name", email.split("@")[0]),
                auth_provider=AuthProvider[provider],
                external_id=user_info.get("sub"),
                role="analyst" # Default role
            )
            self.db.add(user)
        
        self.db.commit()
        self.db.refresh(user)
        
        # Generate our internal JWT
        access_token = create_access_token(data={"sub": user.email, "id": user.id})
        return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "name": user.name, "role": user.role.value}}
