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
        self.ttl = int(os.getenv("FINANCIAL_DATA_CACHE_TTL", 79200))
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
            except Exception as e:
                # Redis failed, fallback to memory
                print(f"Redis get failed: {e}. Falling back to memory.")
                pass

        # Check in-memory cache (fallback or primary)
        item = self.memory_cache.get(key)
        if item:
            timestamp, value = item
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self.memory_cache[key]
        return None

    def set(self, key: str, value: Any):
        # Always set to memory as backup
        self.memory_cache[key] = (time.time(), value)
        
        if self.client:
            try:
                self.client.setex(key, self.ttl, json.dumps(value))
            except Exception as e:
                print(f"Redis set failed: {e}")
                pass

# Singleton instance
cache = FinancialDataCache()
