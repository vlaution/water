from backend.database.models import SessionLocal, SSOConfiguration, init_db
import os

def setup_sso_configs():
    init_db() # Ensure tables exist
    db = SessionLocal()
    try:
        # 1. Google Configuration
        google_config = SSOConfiguration(
            tenant_id="default",
            provider="google",
            client_id="YOUR_GOOGLE_CLIENT_ID",
            client_secret=b"YOUR_GOOGLE_CLIENT_SECRET", # Stored as bytes
            issuer_url="https://accounts.google.com",
            redirect_uri="http://localhost:8000/auth/sso/callback/google"
        )
        
        # 2. Okta Configuration
        okta_config = SSOConfiguration(
            tenant_id="default",
            provider="okta",
            client_id="YOUR_OKTA_CLIENT_ID",
            client_secret=b"YOUR_OKTA_CLIENT_SECRET",
            issuer_url="https://your-org.okta.com",
            redirect_uri="http://localhost:8000/auth/sso/callback/okta"
        )

        # 3. Azure AD Configuration
        azure_config = SSOConfiguration(
            tenant_id="default",
            provider="azure_ad",
            client_id="YOUR_AZURE_CLIENT_ID",
            client_secret=b"YOUR_AZURE_CLIENT_SECRET",
            issuer_url="https://login.microsoftonline.com/common/v2.0",
            redirect_uri="http://localhost:8000/auth/sso/callback/azure_ad"
        )

        # Upsert logic
        for config in [google_config, okta_config, azure_config]:
            existing = db.query(SSOConfiguration).filter_by(provider=config.provider).first()
            if existing:
                print(f"Updating config for {config.provider}...")
                existing.client_id = config.client_id
                existing.client_secret = config.client_secret
                existing.issuer_url = config.issuer_url
                existing.redirect_uri = config.redirect_uri
            else:
                print(f"Creating config for {config.provider}...")
                db.add(config)
        
        db.commit()
        print("✅ SSO Configurations updated successfully!")
        
    except Exception as e:
        print(f"❌ Error updating configurations: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_sso_configs()
