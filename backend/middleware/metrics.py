import time
import threading
import os
from typing import List, Dict, Any
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.database.models import SessionLocal, SystemMetric
from backend.auth.jwt_handler import verify_token

class MetricsBuffer:
    """Thread-safe buffer for metrics to batch insert."""
    
    def __init__(self, batch_size: int = 100, flush_interval: int = 30):
        self.buffer: List[Dict[str, Any]] = []
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.lock = threading.RLock()
        self.last_flush = time.time()
        
        # Start background flusher thread
        self.flusher_thread = threading.Thread(target=self._periodic_flush, daemon=True)
        self.flusher_thread.start()
        
    def add(self, metric: Dict[str, Any]):
        """Add a metric to the buffer."""
        with self.lock:
            self.buffer.append(metric)
            should_flush = len(self.buffer) >= self.batch_size
            
        if should_flush:
            self._flush()
    
    def _flush(self):
        """Flush buffer to database."""
        with self.lock:
            if not self.buffer:
                return
            metrics_to_insert = self.buffer.copy()
            self.buffer = []
            self.last_flush = time.time()
            
        # Insert in background to avoid blocking
        threading.Thread(target=self._insert_batch, args=(metrics_to_insert,)).start()
    
    def _insert_batch(self, metrics: List[Dict[str, Any]]):
        """Insert a batch of metrics into the database."""
        db = SessionLocal()
        try:
            db_metrics = [SystemMetric(**m) for m in metrics]
            db.add_all(db_metrics)
            db.commit()
        except Exception as e:
            print(f"Error inserting metrics batch: {e}")
            db.rollback()
        finally:
            db.close()
            
    def _periodic_flush(self):
        """Periodically flush buffer if not full."""
        while True:
            time.sleep(self.flush_interval)
            with self.lock:
                time_since_flush = time.time() - self.last_flush
                if self.buffer and time_since_flush >= self.flush_interval:
                    self._flush()

# Global buffer instance
metrics_buffer = MetricsBuffer()

class SystemMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip metrics endpoints and health checks to avoid recursion/noise
        if request.url.path.startswith('/api/performance') or \
           request.url.path.startswith('/health') or \
           request.url.path.startswith('/docs') or \
           request.url.path.startswith('/openapi.json'):
            return await call_next(request)

        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)
        
        # Extract user_id if available (best effort)
        user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                # We verify token to get claims, but ignore expiry for metrics if needed
                # For now, standard verification
                payload = verify_token(token)
                if payload:
                    user_id = int(payload.get("sub"))
        except Exception:
            pass # Fail silently for metrics
            
        # Hash IP for privacy
        import hashlib
        import random
        
        # Sampling: Only record 10% of requests by default
        sample_rate = float(os.getenv("METRICS_SAMPLE_RATE", "0.1"))
        if random.random() > sample_rate:
             return response

        ip_addr = request.client.host if request.client else "unknown"
        hashed_ip = hashlib.sha256(ip_addr.encode()).hexdigest()

        # Add to buffer
        metric = {
            'endpoint': request.url.path,
            'method': request.method,
            'response_time_ms': duration_ms,
            'status_code': response.status_code,
            'user_id': user_id,
            'timestamp': None, # Let DB set default or set here? Model has default=datetime.utcnow
            'ip_address': hashed_ip,
            'user_agent': request.headers.get("user-agent")
        }
        
        # We need to set timestamp explicitly if we want it to be accurate to request time, 
        # but for batching, slight delay is fine. 
        # However, SystemMetric model expects datetime object if we pass it.
        # Let's import datetime
        from datetime import datetime
        metric['timestamp'] = datetime.utcnow()
        
        metrics_buffer.add(metric)
            
        return response
