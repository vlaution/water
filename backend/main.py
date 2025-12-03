from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import routes
from backend.api import auth_routes
from backend.database.models import init_db
import os

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from backend.utils.limiter import limiter

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Configure CORS with environment variable support
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
print(f"Allowed Frontend URL: {frontend_url}")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175"
]

# Add production frontend URL if specified
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router)
app.include_router(auth_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Enterprise Valuation Automation API"}
