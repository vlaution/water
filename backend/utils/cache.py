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
        # self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.enabled = False
        self.memory_cache = {}
        print("Redis disabled. Using in-memory cache.")

    async def get(self, key: str) -> Optional[Any]:
        return self.memory_cache.get(key)

    async def set(self, key: str, value: Any, ttl: int = 3600):
        self.memory_cache[key] = value

    def get_sync(self, key: str) -> Optional[Any]:
        return self.memory_cache.get(key)

    def set_sync(self, key: str, value: Any, ttl: int = 3600):
        self.memory_cache[key] = value

cache = Cache()

import functools
import hashlib
from fastapi import Request, Response

def cached(expire: int = 300):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            # Simple key generation based on function name and kwargs
            # For more complex cases (like based on Request params), we might need parsing
            key_parts = [func.__name__]
            for k, v in kwargs.items():
                if isinstance(v, (str, int, float, bool)):
                    key_parts.append(f"{k}:{v}")
                # We skip complex objects like Request, User, Service for key generation
                # causing potential collisions if results depend on them but they aren't unique per user
                # BUT for portfolio summary, it IS per user implicitly? 
                # Actually get_portfolio_summary depends on current_user IF we filter by user.
                # The current implementation fetches ALL runs, so it's global.
                # If we filter by user, we need user ID in key.
            
            # Try to find user in kwargs (FastAPI dependency injection puts them there)
            if "current_user" in kwargs and hasattr(kwargs["current_user"], "id"):
                 key_parts.append(f"uid:{kwargs['current_user'].id}")

            key = "cache:" + hashlib.md5(":".join(key_parts).encode()).hexdigest()
            print(f"[CACHE] Checking key: {key} for {func.__name__} KeyParts: {key_parts}")
            
            # Check cache
            cached_val = await cache.get(key)
            if cached_val:
                print(f"[CACHE] Hit for key: {key}")
                return cached_val
            
            print(f"[CACHE] Miss for key: {key}")
            # Run function
            result = await func(*args, **kwargs)
            
            # Cache result
            from fastapi.encoders import jsonable_encoder
            to_cache = jsonable_encoder(result)
            
            await cache.set(key, to_cache, ttl=expire)
            print(f"[CACHE] Set key: {key}")
            
            return result
        return wrapper
    return decorator
