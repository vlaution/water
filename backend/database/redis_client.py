import logging
import time
from typing import Optional, Dict, Any

class InMemoryRedisClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(InMemoryRedisClient, cls).__new__(cls)
            cls._instance._init_store()
        return cls._instance

    def _init_store(self):
        self.store: Dict[str, Any] = {}
        self.expiries: Dict[str, float] = {}
        # Mock client attribute for code checking internal client existence
        self.client = True 
        logging.info("Initialized In-Memory 'Redis' Client")

    def set(self, key: str, value: str, ex: int = None) -> bool:
        """Set key to hold the string value."""
        try:
            self.store[key] = value
            if ex:
                self.expiries[key] = time.time() + ex
            else:
                if key in self.expiries:
                    del self.expiries[key]
            return True
        except Exception as e:
            logging.error(f"InMemoryRedis set error: {e}")
            return False

    def get(self, key: str) -> Optional[str]:
        """Get the value of key."""
        try:
            # Check expiry
            if key in self.expiries:
                if time.time() > self.expiries[key]:
                    self.delete(key)
                    return None
            
            return self.store.get(key)
        except Exception as e:
            logging.error(f"InMemoryRedis get error: {e}")
            return None

    def delete(self, key: str) -> int:
        """Delete a key."""
        try:
            if key in self.expiries:
                del self.expiries[key]
            
            if key in self.store:
                del self.store[key]
                return 1
            return 0
        except Exception as e:
            logging.error(f"InMemoryRedis delete error: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        if key in self.expiries:
            if time.time() > self.expiries[key]:
                self.delete(key)
                return False
        return key in self.store

# Singleton instance
redis_client = InMemoryRedisClient()
