"""
Test suite for SSO authentication functionality.
Tests SSO login flow, callback handling, and refresh token mechanism.
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from main import app
from database.models import User, SSOConfiguration, AuthProvider
from auth.jwt_handler import create_access_token, create_refresh_token


client = TestClient(app)


class TestLocalAuth:
    """Test that local authentication still works after SSO integration."""
    
    def test_local_signup_still_works(self, db_session):
        """Ensure existing signup functionality is not broken."""
        response = client.post("/auth/signup", json={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "test@example.com"
    
    def test_local_login_still_works(self, db_session):
        """Ensure existing login functionality is not broken."""
        # First create a user
        client.post("/auth/signup", json={
            "email": "login@example.com",
            "password": "password123",
            "name": "Login User"
        })
        
        # Then login
        response = client.post("/auth/login", json={
            "email": "login@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data


class TestSSOFlow:
    """Test SSO authentication flow."""
    
    @patch('services.auth.sso_service.SSOService.get_config')
    @patch('services.auth.sso_service.SSOService.get_login_url')
    def test_sso_redirect(self, mock_get_login_url, mock_get_config):
        """Test SSO login redirects to IdP."""
        mock_config = Mock()
        mock_config.provider = "google"
        mock_get_config.return_value = mock_config
        mock_get_login_url.return_value = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test"
        
        response = client.get("/auth/sso/google", follow_redirects=False)
        assert response.status_code == 307  # Redirect
        assert "google.com" in response.headers["location"]
    
    @patch('services.auth.sso_service.SSOService.exchange_code')
    @patch('services.auth.sso_service.SSOService.get_user_info')
    def test_sso_callback_creates_user(self, mock_get_user_info, mock_exchange_code, db_session):
        """Test SSO callback creates a new user."""
        # Mock IdP responses
        mock_exchange_code.return_value = {"access_token": "mock_access_token"}
        mock_get_user_info.return_value = {
            "email": "sso@example.com",
            "name": "SSO User",
            "sub": "google_12345"
        }
        
        response = client.get("/auth/sso/google/callback?code=mock_code")
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "sso@example.com"
    
    @patch('services.auth.sso_service.SSOService.exchange_code')
    @patch('services.auth.sso_service.SSOService.get_user_info')
    def test_sso_callback_updates_existing_user(self, mock_get_user_info, mock_exchange_code, db_session):
        """Test SSO callback updates existing user with SSO info."""
        # Create existing local user
        client.post("/auth/signup", json={
            "email": "existing@example.com",
            "password": "password123",
            "name": "Existing User"
        })
        
        # Mock IdP responses with same email
        mock_exchange_code.return_value = {"access_token": "mock_access_token"}
        mock_get_user_info.return_value = {
            "email": "existing@example.com",
            "name": "Existing User",
            "sub": "google_67890"
        }
        
        response = client.get("/auth/sso/google/callback?code=mock_code")
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "existing@example.com"


class TestRefreshToken:
    """Test refresh token functionality."""
    
    def test_refresh_token_flow(self, db_session):
        """Test that refresh token can be used to get new access token."""
        # Signup to get tokens
        signup_response = client.post("/auth/signup", json={
            "email": "refresh@example.com",
            "password": "password123",
            "name": "Refresh User"
        })
        refresh_token = signup_response.json()["refresh_token"]
        
        # Use refresh token
        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_invalid_refresh_token(self):
        """Test that invalid refresh token is rejected."""
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid_token"
        })
        assert response.status_code == 401


class TestMixedAuthScenarios:
    """Test edge cases with mixed authentication methods."""
    
    @patch('services.auth.sso_service.SSOService.exchange_code')
    @patch('services.auth.sso_service.SSOService.get_user_info')
    def test_user_with_local_auth_can_use_sso(self, mock_get_user_info, mock_exchange_code, db_session):
        """Test that user with local auth can also login via SSO."""
        # Create local user
        client.post("/auth/signup", json={
            "email": "mixed@example.com",
            "password": "password123",
            "name": "Mixed User"
        })
        
        # Login via SSO with same email
        mock_exchange_code.return_value = {"access_token": "mock_access_token"}
        mock_get_user_info.return_value = {
            "email": "mixed@example.com",
            "name": "Mixed User",
            "sub": "google_mixed"
        }
        
        response = client.get("/auth/sso/google/callback?code=mock_code")
        assert response.status_code == 200


# Fixtures
@pytest.fixture
def db_session():
    """Provide a database session for tests."""
    from database.models import SessionLocal, init_db
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
