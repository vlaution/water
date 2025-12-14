import time
import functools
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.database.models import SessionLocal, ValuationMetric
import threading

class ValuationTracker:
    """Context manager for tracking valuation execution."""
    
    def __init__(self, method_type: str, valuation_id: str, user_id: int, complexity_score: int = 1):
        self.method_type = method_type
        self.valuation_id = valuation_id
        self.user_id = user_id
        self.complexity_score = complexity_score
        self.start_time = None
        
    def __enter__(self):
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        end_time = time.time()
        duration_ms = int((end_time - self.start_time) * 1000)
        
        # Record metric in background
        threading.Thread(target=self._record_metric, args=(self.start_time, end_time, duration_ms)).start()
        
    def _record_metric(self, start_ts, end_ts, duration_ms):
        db: Session = SessionLocal()
        try:
            metric = ValuationMetric(
                valuation_id=self.valuation_id,
                method_type=self.method_type,
                start_time=datetime.fromtimestamp(start_ts),
                end_time=datetime.fromtimestamp(end_ts),
                duration_ms=duration_ms,
                cache_hit=False, # TODO: Implement cache tracking
                input_complexity_score=self.complexity_score,
                user_id=self.user_id
            )
            db.add(metric)
            db.commit()
        except Exception as e:
            print(f"Error recording valuation metric: {e}")
        finally:
            db.close()

def instrument_valuation(method_type: str):
    """
    Decorator to instrument valuation methods.
    Assumes the decorated function takes 'valuation_id' and 'user_id' as arguments,
    or they are available in kwargs.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract arguments
            valuation_id = kwargs.get('valuation_id')
            user_id = kwargs.get('user_id')
            
            # If not in kwargs, try to find in args if possible, or skip
            # For now, we rely on kwargs as per convention
            
            # Calculate complexity (placeholder)
            complexity = 1
            if 'input_data' in kwargs:
                # Simple heuristic: size of input data
                try:
                    complexity = len(str(kwargs['input_data'])) // 1000
                except:
                    pass

            with ValuationTracker(method_type, valuation_id, user_id, complexity_score=complexity):
                return await func(*args, **kwargs)
        return wrapper
    return decorator
