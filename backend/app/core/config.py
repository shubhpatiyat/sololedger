from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SoloLedger API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./sololedger.db"

    supabase_jwt_secret: str = ""
    supabase_audience: str = "authenticated"
    allow_dev_auth: bool = True
    auth_jwt_secret: str = "sololedger-dev-jwt-secret"
    auth_password_secret: str = "sololedger-dev-password-secret"
    auth_access_token_expiry_minutes: int = 60
    auth_refresh_token_expiry_days: int = 7
    auth_refresh_cookie_name: str = "sololedger_refresh_token"
    auth_cookie_secure: bool = False

    azure_api_key: str = ""
    azure_endpoint: str = ""
    azure_openai_deployment: str = "gpt-4.1-mini"
    azure_openai_model: str = "gpt-4.1-mini"
    azure_openai_api_version: str = "2024-12-01-preview"
    local_bill_storage_dir: str = "./storage/bills"
    local_invoice_storage_dir: str = "./storage/invoices"
    local_invoice_logo_storage_dir: str = "./storage/invoice-logos"
    frontend_base_url: str = "http://localhost:8080"
    oauth_state_secret: str = "sololedger-oauth-state-secret"
    token_encryption_secret: str = "sololedger-token-encryption-secret"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""
    microsoft_redirect_uri: str = ""
    smtp_api_key: str = ""
    smtp_from_email: str = "onboarding@resend.dev"


settings = Settings()
