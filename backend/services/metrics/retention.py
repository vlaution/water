from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.models import SessionLocal, SystemMetric, ValuationMetric
# from celery_app import celery_app

# @celery_app.task(name='services.metrics.retention.cleanup_old_metrics')
def cleanup_old_metrics(days_to_keep: int = 30):
    """
    Celery task to clean up old metrics.
    Runs daily at 2 AM via Celery Beat.
    
    Args:
        days_to_keep: Number of days to retain raw metrics (default: 30)
    """
    db: Session = SessionLocal()
    
    try:
        cutoff = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Delete old system metrics
        system_deleted = db.query(SystemMetric)\
            .filter(SystemMetric.timestamp < cutoff)\
            .delete(synchronize_session=False)
        
        # Delete old valuation metrics
        valuation_deleted = db.query(ValuationMetric)\
            .filter(ValuationMetric.created_at < cutoff)\
            .delete(synchronize_session=False)
        
        db.commit()
        
        return {
            'system_metrics_deleted': system_deleted,
            'valuation_metrics_deleted': valuation_deleted,
            'cutoff_date': cutoff.isoformat()
        }
        
    except Exception as e:
        print(f"Error cleaning up old metrics: {e}")
        db.rollback()
        raise
    finally:
        db.close()
