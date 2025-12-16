import redis
import os
import logging

class RedisClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance._init_redis()
        return cls._instance

    def _init_redis(self):
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", 6379))
        self.client = redis.Redis(host=host, port=port, db=0, decode_responses=True)
        try:
            self.client.ping()
            logging.info(f"Connected to Redis at {host}:{port}")
        except redis.ConnectionError:
            logging.warning(f"Failed to connect to Redis at {host}:{port}. Caching/Security features may be degraded.")
            self.client = None

    def set(self, key: str, value: str, ex: int = None):
        if self.client:
            try:
                self.client.set(key, value, ex=ex)
                return True
            except redis.RedisError:
                return False
        return False

    def get(self, key: str):
        if self.client:
            try:
                return self.client.get(key)
            except redis.RedisError:
                return None
        return None

    def delete(self, key: str):
        if self.client:
            try:
                return self.client.delete(key)
            except redis.RedisError:
                return None
        return None

# Singleton instance
redis_client = RedisClient()
