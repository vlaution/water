import json
import os
from typing import Any, Optional

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Redis module not found. Using in-memory cache.")

class Cache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.enabled = False
        self.memory_cache = {}
        
        if REDIS_AVAILABLE:
            try:
                self.redis = redis.from_url(self.redis_url, decode_responses=True)
                self.redis.ping()
                self.enabled = True
                print("Redis connected successfully.")
            except redis.ConnectionError:
                print("Redis connection failed. Using in-memory cache.")
        else:
             print("Redis not available. Using in-memory cache.")

    async def get(self, key: str) -> Optional[Any]:
        if self.enabled:
            try:
                data = self.redis.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                print(f"Redis get error: {e}")
                return None
        else:
            return self.memory_cache.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600):
        if self.enabled:
            try:
                self.redis.setex(key, ttl, json.dumps(value))
            except Exception as e:
                print(f"Redis set error: {e}")
        else:
            self.memory_cache[key] = value
            # Note: In-memory cache doesn't implement TTL for simplicity in this fallback

    def get_sync(self, key: str) -> Optional[Any]:
        if self.enabled:
            try:
                data = self.redis.get(key)
                return json.loads(data) if data else None
            except Exception as e:
                print(f"Redis get error: {e}")
                return None
        else:
            return self.memory_cache.get(key)

    def set_sync(self, key: str, value: Any, ttl: int = 3600):
        if self.enabled:
            try:
                self.redis.setex(key, ttl, json.dumps(value))
            except Exception as e:
                print(f"Redis set error: {e}")
        else:
            self.memory_cache[key] = value

cache = Cache()
