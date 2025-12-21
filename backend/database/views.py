from sqlalchemy import text
from backend.database.models import engine

def create_views():
    """Create SQL views for common aggregations."""
    
    is_postgres = 'postgres' in engine.dialect.name.lower()
    
    # 1. Daily System Stats View
    if is_postgres:
        daily_stats_sql = """
        CREATE OR REPLACE VIEW daily_system_stats AS
        SELECT 
            date(timestamp) as day,
            endpoint,
            count(*) as request_count,
            avg(response_time_ms) as avg_latency,
            sum(case when status_code >= 400 then 1 else 0 end) as error_count
        FROM system_metrics
        GROUP BY 1, 2;
        """
    else:
        # For SQLite, we use a simple CREATE VIEW. 
        # If it already exists, we might need to drop it or just ignore.
        daily_stats_sql = """
        DROP VIEW IF EXISTS daily_system_stats;
        CREATE VIEW daily_system_stats AS
        SELECT 
            date(timestamp) as day,
            endpoint,
            count(*) as request_count,
            avg(response_time_ms) as avg_latency,
            sum(case when status_code >= 400 then 1 else 0 end) as error_count
        FROM system_metrics
        GROUP BY day, endpoint;
        """
    
    # 2. Hourly Valuation Stats View
    if is_postgres:
        hourly_valuation_sql = """
        CREATE OR REPLACE VIEW hourly_valuation_stats AS
        SELECT 
            date_trunc('hour', created_at) as hour,
            method_type,
            count(*) as run_count,
            avg(duration_ms) as avg_duration
        FROM valuation_metrics
        GROUP BY 1, 2;
        """
    else:
        hourly_valuation_sql = """
        DROP VIEW IF EXISTS hourly_valuation_stats;
        CREATE VIEW hourly_valuation_stats AS
        SELECT 
            strftime('%Y-%m-%d %H:00:00', created_at) as hour,
            method_type,
            count(*) as run_count,
            avg(duration_ms) as avg_duration
        FROM valuation_metrics
        GROUP BY 1, 2;
        """
    
    with engine.connect() as conn:
        # Split multi-statement SQL for non-postgres if needed (simple execution)
        if not is_postgres:
            for stmt in daily_stats_sql.split(';'):
                if stmt.strip():
                    conn.execute(text(stmt))
            for stmt in hourly_valuation_sql.split(';'):
                if stmt.strip():
                    conn.execute(text(stmt))
        else:
            conn.execute(text(daily_stats_sql))
            conn.execute(text(hourly_valuation_sql))
        conn.commit()
