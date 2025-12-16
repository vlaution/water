import asyncio
import sys
import os

# Ensure backend can be imported
sys.path.append(os.getcwd())

from backend.compliance.assistant import ComplianceAssistant

async def verify_realtime_monitor():
    print("=== Testing Real-time Compliance Monitor ===")
    
    # 1. Initialize Assistant
    assistant = ComplianceAssistant()
    
    # 2. Simulate Safe Inputs
    print("\n[1] Testing SAFE Inputs...")
    safe_inputs = {"growth_rate": 0.02, "wacc": 0.08} # Safe values
    result_safe = await assistant.monitor_valuation("val_safe_001", "user_1", safe_inputs)
    
    if result_safe == "CLEAN":
        print("PASS: Safe inputs triggered no alerts.")
    else:
        print(f"FAIL: Safe inputs triggered alert: {result_safe}")
        
    # 3. Simulate Dangerous Inputs
    print("\n[2] Testing DANGEROUS Inputs...")
    danger_inputs = {"growth_rate": 0.20, "wacc": 0.08} # 20% growth is crazy high
    result_danger = await assistant.monitor_valuation("val_risk_999", "user_1", danger_inputs)
    
    if result_danger == "ALERTS_SENT":
        print("PASS: Dangerous inputs triggered Critical Alert.")
    else:
        print(f"FAIL: Dangerous inputs did NOT trigger alert: {result_danger}")

if __name__ == "__main__":
    asyncio.run(verify_realtime_monitor())
