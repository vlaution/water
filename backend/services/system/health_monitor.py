import psutil
import time
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    uptime_seconds: float
    active_connections: int

class RequestLog(BaseModel):
    timestamp: str
    method: str
    endpoint: str
    status_code: int
    duration_ms: float

class HealthMonitorService:
    def __init__(self):
        self.start_time = time.time()
        self.request_logs: List[RequestLog] = []
        self.max_logs = 100
        self.request_counts = {"total": 0, "success": 0, "error": 0}

    def get_system_stats(self) -> SystemStats:
        """
        Returns current system resource usage.
        """
        return SystemStats(
            cpu_percent=psutil.cpu_percent(interval=None),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage('/').percent,
            uptime_seconds=time.time() - self.start_time,
            active_connections=len(psutil.net_connections())
        )

    def log_request(self, method: str, endpoint: str, status_code: int, duration_ms: float):
        """
        Logs an API request for metrics tracking.
        """
        self.request_counts["total"] += 1
        if 200 <= status_code < 400:
            self.request_counts["success"] += 1
        else:
            self.request_counts["error"] += 1

        log = RequestLog(
            timestamp=datetime.now().isoformat(),
            method=method,
            endpoint=endpoint,
            status_code=status_code,
            duration_ms=duration_ms
        )
        
        self.request_logs.insert(0, log)
        if len(self.request_logs) > self.max_logs:
            self.request_logs.pop()

    def get_metrics(self) -> Dict[str, Any]:
        """
        Returns aggregated metrics and logs.
        """
        return {
            "system": self.get_system_stats().dict(),
            "requests": self.request_counts,
            "recent_logs": [log.dict() for log in self.request_logs[:20]]
        }

health_monitor_service = HealthMonitorService()
