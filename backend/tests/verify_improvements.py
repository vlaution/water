import sys
import os
import time
import threading
from datetime import datetime
from sqlalchemy import text

# Add project root to path (parent of backend)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.database.models import SessionLocal, SystemMetric, ValuationMetric, init_db
from backend.middleware.metrics import metrics_buffer
from backend.services.alerting.service import alert_service, ConsoleChannel
from backend.database.views import create_views

def test_metrics_buffer():
    print("\n🧪 Testing MetricsBuffer...")
    
    # Clear existing metrics
    db = SessionLocal()
    db.query(SystemMetric).delete()
    db.commit()
    
    # Add metrics
    print("   Adding 5 metrics to buffer...")
    for i in range(5):
        metrics_buffer.add({
            'endpoint': '/test',
            'method': 'GET',
            'response_time_ms': 100,
            'status_code': 200,
            'user_id': None,
            'timestamp': datetime.utcnow(),
            'ip_address': '127.0.0.1',
            'user_agent': 'Test'
        })
    
    # Force flush
    print("   Forcing flush...")
    metrics_buffer._flush()
    
    # Wait for background thread
    time.sleep(1)
    
    # Verify
    count = db.query(SystemMetric).count()
    print(f"   Metrics in DB: {count}")
    
    if count == 5:
        print("✅ MetricsBuffer works!")
    else:
        print(f"❌ MetricsBuffer failed! Expected 5, got {count}")
    db.close()

def test_alerting():
    print("\n🧪 Testing AlertService...")
    
    # Mock channel
    class MockChannel(ConsoleChannel):
        def __init__(self):
            self.alerts = []
        def send(self, title, message, level):
            self.alerts.append((title, level))
            
    mock_channel = MockChannel()
    alert_service.channels = [mock_channel]
    
    # Test High Latency
    print("   Testing High Latency Alert...")
    alert_service.check_system_metrics({
        'p95_response_time': 6000, # > 5000 threshold
        'error_rate': 0.01
    })
    
    if any(a[0] == 'High Latency Detected' for a in mock_channel.alerts):
        print("✅ High Latency Alert triggered!")
    else:
        print("❌ High Latency Alert failed!")
        
    # Test High Error Rate
    print("   Testing High Error Rate Alert...")
    mock_channel.alerts = []
    alert_service.check_system_metrics({
        'p95_response_time': 100,
        'error_rate': 0.10 # > 0.05 threshold
    })
    
    if any(a[0] == 'High Error Rate Detected' for a in mock_channel.alerts):
        print("✅ High Error Rate Alert triggered!")
    else:
        print("❌ High Error Rate Alert failed!")

def test_views():
    print("\n🧪 Testing SQL Views...")
    
    # Ensure views exist
    create_views()
    
    db = SessionLocal()
    try:
        # Insert test data if empty
        if db.query(SystemMetric).count() == 0:
            db.add(SystemMetric(
                endpoint='/api/test',
                method='GET',
                response_time_ms=200,
                status_code=200,
                timestamp=datetime.utcnow()
            ))
            db.commit()
            
        # Query view
        result = db.execute(text("SELECT * FROM daily_system_stats")).fetchall()
        print(f"   Rows in daily_system_stats: {len(result)}")
        
        if len(result) > 0:
            print("✅ SQL Views working!")
        else:
            print("❌ SQL Views returned no data (might be empty DB)")
            
    except Exception as e:
        print(f"❌ SQL Views failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Phase 2 Verification")
    init_db()
    
    test_metrics_buffer()
    test_alerting()
    test_views()
    
    print("\n✨ Verification Complete")
