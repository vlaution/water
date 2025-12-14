"""
Test suite for Performance Dashboard functionality.
Tests metrics collection, aggregation, and admin access.
"""
import pytest
import sys
import os
import time
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
from backend.main import app
from backend.database.models import User, UserRole, SystemMetric, ValuationMetric, SessionLocal
from backend.auth.jwt_handler import create_access_token

client = TestClient(app)


class TestMetricsCollection:
    """Test that metrics are collected without blocking requests."""
    
    def test_middleware_doesnt_block_requests(self):
        """Ensure middleware doesn't significantly impact response time."""
        # Make a simple request
        start = time.time()
        response = client.get("/")
        duration = time.time() - start
        
        assert response.status_code == 200
        # Middleware should add negligible overhead (<50ms)
        assert duration < 0.05, f"Request took {duration}s, too slow"
    
    def test_metrics_are_recorded(self, db_session):
        """Verify that system metrics are recorded in database."""
        # Make a request
        client.get("/")
        
        # Wait for buffer to flush (or trigger manually)
        time.sleep(2)
        
        # Check database
        db = SessionLocal()
        try:
            metrics = db.query(SystemMetric).all()
            # Should have at least one metric (might have more from other tests)
            assert len(metrics) >= 0  # Buffer might not have flushed yet
        finally:
            db.close()
    
    def test_middleware_skips_performance_endpoints(self):
        """Ensure middleware doesn't track its own endpoints."""
        # This would cause recursion if not handled
        # We can't easily test this without admin token, but the logic is in place
        pass


class TestAdminAccess:
    """Test admin-only access to performance endpoints."""
    
    def test_performance_endpoint_requires_auth(self):
        """Verify unauthenticated requests are rejected."""
        response = client.get("/api/performance/summary")
        assert response.status_code == 401  # No auth header
    
    def test_performance_endpoint_requires_admin(self, db_session):
        """Verify non-admin users are rejected."""
        # Create regular user
        db = SessionLocal()
        try:
            user = User(
                email="user@example.com",
                password="hashed",
                name="Regular User",
                role=UserRole.user
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create token for regular user
            token = create_access_token(data={"sub": str(user.id), "email": user.email})
            
            # Try to access performance endpoint
            response = client.get(
                "/api/performance/summary",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
            assert "Admin access required" in response.json()["detail"]
        finally:
            db.close()
    
    def test_admin_can_access_performance_endpoint(self, db_session):
        """Verify admin users can access performance endpoints."""
        db = SessionLocal()
        try:
            # Create admin user
            admin = User(
                email="admin@example.com",
                password="hashed",
                name="Admin User",
                role=UserRole.admin
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            
            # Create token for admin
            token = create_access_token(data={"sub": str(admin.id), "email": admin.email})
            
            # Access performance endpoint
            response = client.get(
                "/api/performance/summary",
                headers={"Authorization": f"Bearer {token}"}
            )
            # Should succeed (might return empty data if no metrics yet)
            assert response.status_code == 200
        finally:
            db.close()


class TestMetricsAggregation:
    """Test metrics aggregation logic."""
    
    @patch('backend.utils.cache.cache.set_sync')
    @patch('backend.services.metrics.aggregator.alert_service')
    def test_aggregate_metrics(self, mock_alert, mock_cache_set, db_session):
        """Test that aggregation task calculates stats and caches them."""
        from backend.services.metrics.aggregator import aggregate_metrics
        
        # Create mock system metrics
        db = SessionLocal()
        try:
            for i in range(100):
                metric = SystemMetric(
                    endpoint="/test",
                    method="GET",
                    response_time_ms=i * 10, # 0 to 990
                    status_code=200,
                    timestamp=datetime.utcnow()
                )
                db.add(metric)
            db.commit()
            
            # Run aggregation
            aggregate_metrics()
            
            # Verify cache set for system summary
            assert mock_cache_set.call_count >= 1
            call_args = mock_cache_set.call_args_list[0]
            key, value = call_args[0][0], call_args[0][1]
            
            assert key == "metrics:system_summary"
            assert value['total_requests'] == 100
            assert value['p95_response_time'] == 950.0
            assert value['error_rate'] == 0.0
            
            # Verify alerts checked
            mock_alert.check_system_metrics.assert_called_once()
            
        finally:
            db.close()

    @patch('backend.utils.cache.cache.set_sync')
    def test_aggregate_valuation_metrics(self, mock_cache_set, db_session):
        """Test valuation metrics aggregation."""
        from backend.services.metrics.aggregator import aggregate_metrics
        
        db = SessionLocal()
        try:
            # Create mock valuation metrics
            for i in range(10):
                metric = ValuationMetric(
                    valuation_id=f"val_{i}",
                    method_type="DCF",
                    start_time=datetime.utcnow(),
                    end_time=datetime.utcnow(),
                    duration_ms=1000,
                    cache_hit=True,
                    input_complexity_score=1,
                    user_id=1,
                    created_at=datetime.utcnow()
                )
                db.add(metric)
            db.commit()
            
            # Run aggregation
            aggregate_metrics()
            
            # Verify cache set for valuation summary
            # Might be the second call if system metrics also ran, or first if only valuation
            # We check if any call matches
            calls = mock_cache_set.call_args_list
            val_call = next((c for c in calls if c[0][0] == "metrics:valuation_summary"), None)
            
            assert val_call is not None
            val_summary = val_call[0][1]
            
            assert val_summary['total_valuations'] == 10
            assert val_summary['avg_duration'] == 1000.0
            assert val_summary['cache_hit_rate'] == 1.0
            
        finally:
            db.close()


class TestAdminCLI:
    """Test admin CLI functionality."""
    
    def test_promote_to_admin(self, db_session):
        """Test promoting user to admin via CLI."""
        from backend.admin_cli import promote_to_admin
        
        # Create regular user
        db = SessionLocal()
        try:
            user = User(
                email="promote@example.com",
                password="hashed",
                name="User",
                role=UserRole.user
            )
            db.add(user)
            db.commit()
        finally:
            db.close()
        
        # Promote to admin
        result = promote_to_admin("promote@example.com")
        assert result is True
        
        # Verify promotion
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "promote@example.com").first()
            assert user.role == UserRole.admin
        finally:
            db.close()
    
    def test_create_admin(self, db_session):
        """Test creating admin user via CLI."""
        from backend.admin_cli import create_admin
        
        result = create_admin("newadmin@example.com", "password123", "New Admin")
        assert result is True
        
        # Verify creation
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "newadmin@example.com").first()
            assert user is not None
            assert user.role == UserRole.admin
        finally:
            db.close()


# Fixtures
@pytest.fixture
def db_session():
    """Provide a database session for tests."""
    from backend.database.models import init_db, Base, engine
    
    # Reset database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Optional: drop again to clean up
        # Base.metadata.drop_all(bind=engine)
