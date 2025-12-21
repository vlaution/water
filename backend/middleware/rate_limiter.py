from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

# Initialize Limiter
# Uses Redis if available, otherwise memory
# redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Force memory storage for single-instance deployment
print("Rate Limiter using memory storage (Redis disabled).")
storage_uri = "memory://"

limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)

def init_rate_limiter(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
