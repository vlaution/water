
import os
from dotenv import load_dotenv
from backend.services.financial_data.alpha_vantage import AlphaVantageProvider

# Load env variables
load_dotenv()

print("\n--- Test: API Key Rotation Setup ---")

# Initialize Provider
try:
    provider = AlphaVantageProvider()
    keys = provider.api_keys
    print(f"Total Keys Loaded: {len(keys)}")
    
    for i, key in enumerate(keys):
        masked_key = f"{key[:4]}..." if len(key) > 4 else key
        print(f"Key {i+1}: {masked_key}")

    if len(keys) > 1:
        print("SUCCESS: Multiple keys detected. Rotation logic is active.")
    else:
        print("WARNING: Only 1 key detected. Rotation will strictly retry the same key (unless it's 'demo').")

except Exception as e:
    print(f"EXCEPTION during initialization: {e}")
