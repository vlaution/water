from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

# Initialize Limiter
# Uses Redis if available, otherwise memory
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    # Check if Redis is actually reachable before passing to Limiter
    # Limiter might fail hard if Redis is down
    import redis
    r = redis.from_url(redis_url)
    r.ping()
    storage_uri = redis_url
    print("Rate Limiter using Redis storage.")
except Exception as e:
    print(f"Rate Limiter Redis connection failed: {e}. Using memory storage.")
    storage_uri = "memory://"

limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)

def init_rate_limiter(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
