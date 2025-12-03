import os
import json
import time
from typing import Optional, Any
try:
    import redis
except ImportError:
    redis = None

class FinancialDataCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.ttl = int(os.getenv("FINANCIAL_DATA_CACHE_TTL", 3600))
        self.client = None
        self.memory_cache = {}
        
        if self.redis_url and redis:
            try:
                self.client = redis.from_url(self.redis_url)
            except Exception as e:
                print(f"Warning: Redis connection failed: {e}. Using in-memory cache.")
        
    def get(self, key: str) -> Optional[Any]:
        if self.client:
            try:
                data = self.client.get(key)
                if data:
                    return json.loads(data)
            except Exception:
                pass
        else:
            # Check in-memory cache
            item = self.memory_cache.get(key)
            if item:
                timestamp, value = item
                if time.time() - timestamp < self.ttl:
                    return value
                else:
                    del self.memory_cache[key]
        return None

    def set(self, key: str, value: Any):
        if self.client:
            try:
                self.client.setex(key, self.ttl, json.dumps(value))
            except Exception:
                pass
        else:
            self.memory_cache[key] = (time.time(), value)

# Singleton instance
cache = FinancialDataCache()
