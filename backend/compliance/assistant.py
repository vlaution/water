import asyncio
from typing import List, Dict, Any
from datetime import datetime
from backend.compliance.framework import ComplianceFramework

class NotificationService:
    """
    Stub for a notification system (WebSockets/Email).
    """
    async def notify_user(self, user_id: str, message: str, remediation: List[str] = None):
        print(f"\n[ALERT] To {user_id}: {message}")
        if remediation:
            print(f"   Remediation: {', '.join(remediation)}")

class ComplianceAssistant:
    def __init__(self):
        self.framework = ComplianceFramework()
        self.notification_service = NotificationService()
        self.active_sessions = {} # valuation_id -> session_data

    async def monitor_valuation(self, valuation_id: str, user_id: str, current_inputs: Dict[str, Any]):
        """
        Simulates one check cycle for real-time monitoring.
        In a real app, this would be a long-running task or hook into input updates.
        """
        print(f"[Monitor] Checking Valuation {valuation_id} for User {user_id}...")
        
        # 1. Run Compliance Checks
        # We need to construct a 'valuation' object that the framework expects
        # or we adapt the framework to accept dict inputs.
        # Framework expects `Valuation` model mainly for `valuation_method`, etc.
        # Let's mock the object structure for now based on inputs.
        
        # Mocking a valuation object for the framework
        class MockValuation:
            def __init__(self, data):
                self.valuation_method = "DCF" # Default for test
                self.inputs = data
                
        val_obj = MockValuation(current_inputs)
        
        # Run Audit
        # We assume we check against all regs
        audit_result = self.framework.audit_valuation(
            valuation_id=valuation_id, 
            valuation_data=val_obj.inputs,
            requested_regs=["asc_820", "sox_404"]
        )
        
        # 2. Analyze for Critical Issues
        critical_issues = []
        
        # Check overall risk
        if audit_result.overall_risk_score >= 8.0:
            critical_issues.append({
                "description": f"High Risk Score detected ({audit_result.overall_risk_score}/10). Audit failure imminent.",
                "remediation": ["Review all high-risk inputs", "Check WACC vs Market"]
            })
            
        # Check specific failed checks (if framework exposes them detailed enough)
        # For this prototype, we'll check inputs directly for 'obvious' errors to demo the alert
        if current_inputs.get("growth_rate", 0) > 0.15: # >15% growth is suspicious for stable co
            critical_issues.append({
                "description": "Perpetual Growth Rate > 15% is aggressive and likely non-compliant.",
                "remediation": ["Reduce growth rate to < 3-4% (GDP level)"]
            })
            
        # 3. Notify
        if critical_issues:
            for issue in critical_issues:
                await self.notification_service.notify_user(
                    user_id=user_id,
                    message=f"Compliance Alert: {issue['description']}",
                    remediation=issue['remediation']
                )
            return "ALERTS_SENT"
        
        print("[Monitor] No critical issues found.")
        return "CLEAN"

    async def start_monitoring_session(self, valuation_id: str, user_id: str):
        """
        Example of how to start a background loop.
        """
        self.active_sessions[valuation_id] = True
        while self.active_sessions.get(valuation_id):
            # Fetch latest inputs (mocked here)
            # await self.monitor_valuation(...)
            await asyncio.sleep(30)
