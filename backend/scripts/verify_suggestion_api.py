import requests
import json

def test_suggestion_api():
    url = "http://localhost:8000/api/ai/suggestions"
    
    payload = {
        "company_data": {
            "sector": "SaaS",
            "revenue": 50000000
        },
        "current_assumptions": {
            "revenue_growth": 0.45,
            "ebitda_margin": -0.15,
            "wacc": 0.12,
            "terminal_growth": 0.03
        },
        "context": {
            "use_case": "fundraising",
            "risk_tolerance": "aggressive"
        }
    }
    
    try:
        # Note: This requires the backend server to be running. 
        # Since we can't easily start the server and keep it running in this environment,
        # we might need to mock the service call or rely on unit tests.
        # However, for this script, we'll assume the user might run it against a live dev server.
        # If the server isn't running, we'll catch the connection error.
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            print("✅ API Call Successful")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ API Call Failed: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("⚠️ Could not connect to server. Ensure backend is running on port 8000.")
        # Fallback: Test the service directly without HTTP
        print("\nTesting Service Logic Directly...")
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        
        from backend.services.ai.suggestion_service import SuggestionService
        service = SuggestionService()
        result = service.generate_suggestions(payload['company_data'], payload['current_assumptions'], payload['context'])
        print("✅ Service Logic Successful")
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_suggestion_api()
