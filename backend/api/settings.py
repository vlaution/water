from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from backend.calculations.models import GlobalConfig
from backend.database.models import User, get_db
from backend.auth.dependencies import get_current_user
from sqlalchemy.orm import Session
from backend.services.auth.sso_service import SSOService
from backend.config.shadow_mode import ShadowModeConfig
import os
import json

router = APIRouter(prefix="/api/settings", tags=["Settings"])

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'global_config.json')

def load_config() -> GlobalConfig:
    if not os.path.exists(CONFIG_FILE):
        return GlobalConfig()
    try:
        with open(CONFIG_FILE, 'r') as f:
            data = json.load(f)
        return GlobalConfig(**data)
    except Exception:
        return GlobalConfig()

def save_config(config: GlobalConfig):
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config.dict(), f, indent=4)

@router.get("/global", response_model=GlobalConfig)
async def get_global_settings():
    return load_config()

@router.post("/global", response_model=GlobalConfig)
async def update_global_settings(
    config: GlobalConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ABSOLUTE RULE: No tuning mid-week
    ShadowModeConfig.enforce_freeze(current_user.id, "Global Config Update", db)
    
    save_config(config)
    return config

# --- Secrets Management ---
# --- Secrets Management ---

class SecretsConfig(BaseModel):
    FRED_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_KEY: Optional[str] = None
    PITCHBOOK_API_KEY: Optional[str] = None
    CAPIQ_API_KEY: Optional[str] = None
    CAPIQ_USERNAME: Optional[str] = None
    CAPIQ_PASSWORD: Optional[str] = None

@router.post("/secrets")
async def update_secrets(
    secrets: SecretsConfig, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save API keys to the current user's profile, encrypted.
    """
    # ABSOLUTE RULE: No tuning mid-week
    ShadowModeConfig.enforce_freeze(current_user.id, "Secrets Update", db)

    # Use SSOService for encryption helper
    sso_service = SSOService() 
    
    # 1. Get existing keys
    existing_keys = {}
    if current_user.api_keys:
        try:
            # We assume api_keys is stored as a JSON string of ENCRYPTED values (base64 encoded strings?)
            # Or maybe just a JSON string of values, and we encrypt the whole blob?
            # Let's verify the model. It is Text.
            # Easiest: JSON string { "KEY": "encrypted_value_b64" }
            existing_keys = json.loads(current_user.api_keys)
        except:
            pass
            
    # 2. Update keys
    new_secrets = secrets.dict(exclude_none=True)
    
    for k, v in new_secrets.items():
        if v:
            # Encrypt
            encrypted_bytes = sso_service.encrypt_secret(v)
            # Store as hex or base64 to put in JSON
            existing_keys[k] = encrypted_bytes.hex()
            
    # 3. Save back to user
    current_user.api_keys = json.dumps(existing_keys)
    current_user.is_demo = False # If they save keys, they are likely not demo users anymore? Or we let them toggle?
    # Let's not force is_demo=False, but it's a strong signal.
    
    db.commit()
    
    return {"status": "success", "message": "Secrets saved securely to your account."}

@router.get("/secrets")
async def get_secrets_status(current_user: User = Depends(get_current_user)):
    """
    Check which keys are configured for the user.
    """
    keys = {}
    if current_user.api_keys:
        try:
            keys = json.loads(current_user.api_keys)
        except:
            pass
            
    return {
        "FRED_API_KEY": "FRED_API_KEY" in keys,
        "ALPHA_VANTAGE_KEY": "ALPHA_VANTAGE_KEY" in keys,
        "PITCHBOOK_API_KEY": "PITCHBOOK_API_KEY" in keys,
        "CAPIQ_API_KEY": "CAPIQ_API_KEY" in keys,
        "CAPIQ_USERNAME": "CAPIQ_USERNAME" in keys,
        "CAPIQ_PASSWORD": "CAPIQ_PASSWORD" in keys
    }
