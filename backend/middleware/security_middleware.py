from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response
from backend.database.models import SessionLocal
from backend.services.audit_service import AuditLogger
from backend.auth.jwt_handler import verify_token
import time

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # CSP - Content Security Policy
        # Adjust directives as needed for your specific frontend requirements
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img_src 'self' data: https:; "
            "script_src 'self' 'unsafe-inline' 'unsafe-eval'; " # unsafe-inline/eval often needed for React/Next.js dev
            "style_src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font_src 'self' https://fonts.gstatic.com data:;"
        )
        
        # HSTS - HTTP Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response

class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Skip audit for read-only GET requests to avoid noise, or log everything if required
        # For now, let's log state-changing methods
        if request.method not in ["POST", "PUT", "DELETE", "PATCH"]:
            return await call_next(request)

        # Capture start time
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Async logging to not block response
        # Note: In a real production app, use a background task or queue
        try:
            self.log_request(request, response)
        except Exception as e:
            print(f"Audit logging failed: {e}")

        return response

    def log_request(self, request: Request, response: Response):
        db = SessionLocal()
        try:
            logger = AuditLogger(db)
            
            # Extract user from token if present
            user_id = None
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                if payload:
                    user_id = int(payload.get("sub"))

            # Determine action type
            path = request.url.path
            method = request.method
            action_type = f"{method}_{path}"

            logger.log(
                action_type=action_type,
                user_id=user_id,
                ip_address=request.client.host,
                details={
                    "status_code": response.status_code,
                    "method": method,
                    "path": path
                }
            )
        finally:
            db.close()
