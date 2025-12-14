from fastapi import APIRouter, HTTPException
from backend.calculations.models import GlobalConfig
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
async def update_global_settings(config: GlobalConfig):
    save_config(config)
    return config
