from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import time
from backend.services.system.health_monitor import health_monitor_service

# Load environment variables from .env file
# Explicitly point to the .env file in the current directory (backend/)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from backend.api import routes
from backend.api import auth_routes
from backend.database.models import init_db, SessionLocal

# from slowapi.errors import RateLimitExceeded
# from slowapi import _rate_limit_exceeded_handler
# from backend.utils.limiter import limiter

app = FastAPI()
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"Global Exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    # Run synchronous DB initialization in a separate thread to avoid blocking the event loop
    from fastapi.concurrency import run_in_threadpool
    await run_in_threadpool(init_db)
    
    from backend.database.views import create_views
    await run_in_threadpool(create_views)
    
    # Start Market Simulator in background
    from backend.services.realtime.market_simulator import simulate_market_data
    import asyncio
    asyncio.create_task(simulate_market_data())

    # Seed Historical Data
    try:
        from backend.services.historical_data_service import HistoricalDataService
        db = SessionLocal()
        service = HistoricalDataService(db)
        service.seed_defaults()
        db.close()
    except Exception as e:
        print(f"Failed to seed historical data: {e}")

    # Start Scheduler
    from backend.services.system.scheduler_service import scheduler_service
    scheduler_service.start()

@app.on_event("shutdown")
def shutdown_event():
    from backend.services.system.scheduler_service import scheduler_service
    scheduler_service.stop()



# Initialize Rate Limiter
# from backend.middleware.rate_limiter import init_rate_limiter, limiter
# init_rate_limiter(app)

# Configure CORS with environment variable support
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
print(f"Allowed Frontend URL: {frontend_url}")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "https://localhost:3000", # Excel Add-in (typical dev port)
]

# Add production frontend URL if specified
if frontend_url:
    allowed_origins.append(frontend_url)

# app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(AuditMiddleware)
# app.add_middleware(SystemMetricsMiddleware)

# Include routers
# Include routers
from backend.api import performance_routes, compliance_routes, audit_routes, excel_routes, risk_routes, validation_routes, feedback_routes, suggestion_routes, historical_routes, historical_market_data, market_data, settings, advisory, evidence_routes, workflow_routes, regulatory_routes

# Specific routers first to avoid shadowing by generic routes
app.include_router(market_data.router)
app.include_router(historical_market_data.router)

app.include_router(settings.router)
app.include_router(advisory.router)

# General routers
app.include_router(routes.router)
app.include_router(auth_routes.router)
app.include_router(performance_routes.router)
app.include_router(compliance_routes.router)
app.include_router(workflow_routes.router)
app.include_router(regulatory_routes.router)
app.include_router(evidence_routes.router)
app.include_router(audit_routes.router)
app.include_router(excel_routes.router)
app.include_router(risk_routes.router)
app.include_router(validation_routes.router)
app.include_router(feedback_routes.router)
app.include_router(suggestion_routes.router, prefix="/api/ai", tags=["AI Suggestions"])
app.include_router(historical_routes.router)

# Real-time Routes
from backend.api import realtime_routes
app.include_router(realtime_routes.router)

# Analytics Routes
from backend.api import analytics_routes
app.include_router(analytics_routes.router)

# Monte Carlo Routes
from backend.api import monte_carlo_routes
app.include_router(monte_carlo_routes.router)

# Admin Routes
from backend.api import admin_routes
app.include_router(admin_routes.router)

# Report Routes
from backend.api import report_routes
app.include_router(report_routes.router)

@app.get("/api/search")
async def search_companies(q: str):
    from backend.services.peer_finding_service import PeerFindingService
    service = PeerFindingService()
    results = service.search_companies(q)
    return {"results": results}

@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    health_monitor_service.log_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration_ms=process_time
    )
    
    return response

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app", # Fixed regex string
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def read_root():
    return {"message": "Welcome to the Enterprise Valuation Automation API"}

