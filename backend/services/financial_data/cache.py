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

    def set(self, key: str, value: Any, ttl: int = None):
        # Always set to memory as backup
        self.memory_cache[key] = (time.time(), value)
        
        if self.client:
            try:
                self.client.setex(key, ttl or self.ttl, json.dumps(value))
            except Exception as e:
                print(f"Redis set failed: {e}")
                pass

    def clear_pattern(self, pattern: str):
        """
        Clears keys matching a pattern (simple prefix match for memory, scan for Redis).
        """
        # Clear memory cache
        keys_to_delete = [k for k in self.memory_cache.keys() if k.startswith(pattern)]
        for k in keys_to_delete:
            del self.memory_cache[k]
            
        # Clear Redis
        if self.client:
            try:
                # This is a simplified scan, might be slow for large DBs but fine here
                for key in self.client.scan_iter(match=f"{pattern}*"):
                    self.client.delete(key)
            except Exception as e:
                print(f"Redis clear failed: {e}")
                pass

    def cached(self, ttl: int = 3600, key_prefix: str = ""):
        """
        Decorator to cache function results.
        """
        def decorator(func):
            def wrapper(*args, **kwargs):
                # Generate cache key
                # Skip 'self' in args[0] if it's a method
                arg_str = "_".join([str(a) for a in args[1:]]) if args and hasattr(args[0], '__class__') else "_".join([str(a) for a in args])
                kwarg_str = "_".join([f"{k}={v}" for k, v in sorted(kwargs.items())])
                
                # Use function name if prefix not provided
                prefix = key_prefix or func.__name__
                cache_key = f"{prefix}:{arg_str}:{kwarg_str}"
                
                # Check cache
                cached_val = self.get(cache_key)
                if cached_val is not None:
                    return cached_val
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Cache result
                if result is not None:
                    self.set(cache_key, result, ttl=ttl)
                    
                return result
            return wrapper
        return decorator

# Singleton instance
cache = FinancialDataCache()
