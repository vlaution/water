from sqlalchemy import func
from datetime import datetime, timedelta
from backend.database.models import SessionLocal, SystemMetric, ValuationMetric
from backend.utils.cache import cache
# import pandas as pd
import json

def aggregate_metrics():
    """
    Periodic task to aggregate metrics and store/cache results.
    """
    db = SessionLocal()
    try:
        # 1. System Metrics Aggregation (Last 24 hours)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        sys_metrics = db.query(SystemMetric).filter(SystemMetric.timestamp >= last_24h).all()
        
        if sys_metrics:
            import pandas as pd
            df = pd.DataFrame([{
                "endpoint": m.endpoint,
                "method": m.method,
                "response_time": m.response_time_ms,
                "status_code": m.status_code,
                "user_id": m.user_id,
                "timestamp": m.timestamp
            } for m in sys_metrics])
            
            # Calculate stats
            total_requests = len(df)
            avg_response_time = df["response_time"].mean()
            p95_response_time = df["response_time"].quantile(0.95)
            error_rate = len(df[df["status_code"] >= 400]) / total_requests
            
            # Group by endpoint
            endpoint_stats = df.groupby("endpoint").agg({
                "response_time": ["mean", "count"],
                "status_code": lambda x: (x >= 400).sum()
            }).reset_index()
            
            endpoint_stats.columns = ["endpoint", "avg_time", "count", "errors"]
            top_endpoints = endpoint_stats.sort_values("count", ascending=False).head(10).to_dict("records")
            
            # Calculate User Engagement
            active_users = df["user_id"].nunique() if "user_id" in df.columns else 0
            avg_actions = total_requests / active_users if active_users > 0 else 0

            system_summary = {
                "total_requests": int(total_requests),
                "avg_response_time": float(avg_response_time),
                "p95_response_time": float(p95_response_time),
                "error_rate": float(error_rate),
                "active_users": int(active_users),
                "avg_actions_per_user": float(avg_actions),
                "top_endpoints": top_endpoints,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Cache the summary
            cache.set_sync("metrics:system_summary", system_summary, ttl=3600)
            
            # Check for alerts
            from backend.services.alerting.service import alert_service
            alert_service.check_system_metrics(system_summary)
            
        # 2. Valuation Metrics Aggregation
        val_metrics = db.query(ValuationMetric).filter(ValuationMetric.created_at >= last_24h).all()
        
        if val_metrics:
            df_val = pd.DataFrame([{
                "duration": m.duration_ms,
                "cache_hit": m.cache_hit,
                "complexity": m.input_complexity_score,
                "method": m.method_type
            } for m in val_metrics])
            
            # Method Popularity
            method_counts = df_val["method"].value_counts(normalize=True).to_dict()
            method_popularity = {k: float(v) for k, v in method_counts.items()}

            val_summary = {
                "total_valuations": len(df_val),
                "avg_duration": float(df_val["duration"].mean()),
                "cache_hit_rate": float(df_val["cache_hit"].mean()),
                "avg_complexity": float(df_val["complexity"].mean()),
                "method_popularity": method_popularity,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            cache.set_sync("metrics:valuation_summary", val_summary, ttl=3600)
            
    except Exception as e:
        print(f"Aggregation failed: {e}")
    finally:
        db.close()
