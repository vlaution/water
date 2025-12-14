from typing import List, Dict, Any
from datetime import datetime
import os
# Placeholder for email/slack integration
# In a real app, we would use smtplib or requests for Slack/Teams webhooks

class AlertChannel:
    def send(self, title: str, message: str, level: str = "info"):
        raise NotImplementedError

class ConsoleChannel(AlertChannel):
    def send(self, title: str, message: str, level: str = "info"):
        print(f"[{level.upper()}] ALERT: {title} - {message}")

class AlertService:
    def __init__(self):
        self.channels: List[AlertChannel] = [ConsoleChannel()]
        # Load thresholds from config/env
        self.p95_threshold_ms = int(os.getenv("ALERT_P95_THRESHOLD_MS", 5000))
        self.error_rate_threshold = float(os.getenv("ALERT_ERROR_RATE_THRESHOLD", 0.05)) # 5%
        
    def check_system_metrics(self, metrics_summary: Dict[str, Any]):
        """Check system metrics against thresholds."""
        alerts = []
        
        # Check p95 response time
        p95 = metrics_summary.get('p95_response_time', 0)
        if p95 > self.p95_threshold_ms:
            alerts.append({
                'title': 'High Latency Detected',
                'message': f'P95 response time is {p95}ms (Threshold: {self.p95_threshold_ms}ms)',
                'level': 'warning'
            })
            
        # Check error rate
        error_rate = metrics_summary.get('error_rate', 0)
        if error_rate > self.error_rate_threshold:
            alerts.append({
                'title': 'High Error Rate Detected',
                'message': f'Error rate is {error_rate*100:.1f}% (Threshold: {self.error_rate_threshold*100}%)',
                'level': 'critical'
            })
            
        # Send alerts
        for alert in alerts:
            self._notify(alert['title'], alert['message'], alert['level'])
            
    def _notify(self, title: str, message: str, level: str):
        for channel in self.channels:
            try:
                channel.send(title, message, level)
            except Exception as e:
                print(f"Failed to send alert to channel {channel}: {e}")

# Global instance
alert_service = AlertService()
