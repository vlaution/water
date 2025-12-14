
import os
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

api_key = os.getenv("ALPHA_VANTAGE_API_KEY")

print(f"Loaded API Key: {api_key[:4]}..." if api_key and len(api_key) > 4 else f"Loaded API Key: {api_key}")

if not api_key:
    print("ERROR: ALPHA_VANTAGE_API_KEY not found in .env")
    exit(1)

# Test 1: Basic Connectivity (IBM - works with demo key too)
print("\n--- Test 1: Basic Connectivity (IBM) ---")
url = "https://www.alphavantage.co/query"
params = {
    "function": "GLOBAL_QUOTE",
    "symbol": "IBM",
    "apikey": api_key
}

try:
    response = requests.get(url, params=params)
    data = response.json()
    
    if "Global Quote" in data and data["Global Quote"]:
        print("SUCCESS: Retrieved data for IBM.")
        print(f"Price: {data['Global Quote']['05. price']}")
    elif "Information" in data:
        print(f"API LIMIT/INFO: {data['Information']}")
    elif "Error Message" in data:
        print(f"API ERROR: {data['Error Message']}")
    else:
        print(f"UNKNOWN RESPONSE: {data}")

except Exception as e:
    print(f"EXCEPTION: {e}")

# Test 2: Validity Check (AAPL - fails with demo key)
print("\n--- Test 2: Key Validity Check (AAPL) ---")
if api_key == "demo":
    print("Skipping Test 2 because key is 'demo'")
else:
    params["symbol"] = "AAPL"
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "Global Quote" in data and data["Global Quote"]:
            print("SUCCESS: Retrieved data for AAPL. API Key is VALID and not 'demo'.")
            print(f"Price: {data['Global Quote']['05. price']}")
        elif "Information" in data:
             print(f"API LIMIT/INFO: {data['Information']}")
        elif "Error Message" in data:
            print(f"API ERROR: {data['Error Message']}")
            if "Invalid API call" in data.get("Error Message", "") or "thank you" in data.get("Error Message", "").lower():
                 print(">> DIAGNOSIS: The API Key might be invalid or only limited to demo symbols if you see a specific message.")
        else:
            print(f"UNKNOWN RESPONSE: {data}")

    except Exception as e:
        print(f"EXCEPTION: {e}")
