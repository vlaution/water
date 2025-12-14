import requests
import json

def test_portfolio_dashboard():
    print("Testing Portfolio Dashboard API...")
    
    # 0. Signup (if needed)
    signup_url = "http://localhost:8000/auth/signup"
    signup_data = {"email": "portfolio_test@example.com", "password": "password123", "name": "Test User"}
    try:
        requests.post(signup_url, json=signup_data)
    except:
        pass

    # 1. Login to get token
    login_url = "http://localhost:8000/auth/login"
    login_data = {"email": "portfolio_test@example.com", "password": "password123"}
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Call Portfolio Dashboard Endpoint
        dashboard_url = "http://localhost:8000/api/dashboard/portfolio"
        response = requests.get(dashboard_url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("Successfully fetched portfolio data!")
            
            # 3. Verify Structure
            print(f"Total EV: ${data['portfolio_summary']['total_ev']:,.2f}")
            print(f"Active Companies: {data['portfolio_summary']['active_companies']}")
            print(f"Weighted Avg Multiple: {data['portfolio_summary'].get('weighted_avg_multiple', 'N/A')}")
            print(f"Data Quality Score: {data['portfolio_summary'].get('data_quality_score', 'N/A')}")
            print(f"Last Updated: {data['portfolio_summary'].get('last_updated', 'N/A')}")
            print(f"Heatmap Items: {len(data['valuation_heatmap'])}")
            print(f"Timeline Points: {len(data['valuation_timeline'])}")
            print(f"Risk Matrix Items: {len(data['risk_matrix'])}")
            
            # Check specific fields
            if len(data['valuation_heatmap']) > 0:
                print(f"Sample Heatmap Item: {data['valuation_heatmap'][0]['company_name']} - Score: {data['valuation_heatmap'][0]['confidence_score']}")
                
        else:
            print(f"Failed to fetch dashboard data: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_portfolio_dashboard()
