from sqlalchemy import text
from backend.database.models import engine

def create_views():
    """Create SQL views for common aggregations."""
    
    # View for daily system stats
    daily_stats_sql = """
    CREATE VIEW IF NOT EXISTS daily_system_stats AS
    SELECT 
        date(timestamp) as day,
        endpoint,
        count(*) as request_count,
        avg(response_time_ms) as avg_latency,
        sum(case when status_code >= 400 then 1 else 0 end) as error_count
    FROM system_metrics
    GROUP BY date(timestamp), endpoint;
    """
    
    # View for hourly valuation stats
    hourly_valuation_sql = """
    CREATE VIEW IF NOT EXISTS hourly_valuation_stats AS
    SELECT 
        strftime('%Y-%m-%d %H:00:00', created_at) as hour,
        method_type,
        count(*) as run_count,
        avg(duration_ms) as avg_duration
    FROM valuation_metrics
    GROUP BY strftime('%Y-%m-%d %H:00:00', created_at), method_type;
    """
    
    with engine.connect() as conn:
        conn.execute(text(daily_stats_sql))
        conn.execute(text(hourly_valuation_sql))
        conn.commit()
