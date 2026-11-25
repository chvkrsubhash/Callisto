from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    jwt_secret_key: str = "-dev-secret-change-in-production-64-chars-minimum-length"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    token_encryption_key: str = ""

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "callisto_db"

    default_country: str = "India"
    default_timezone: str = "Asia/Kolkata"
    default_date_format: str = "DD/MM/YYYY"
    default_time_format: str = "12h"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Callisto by AkashaVyom Labs"
    smtp_use_tls: bool = True

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = "mailto:support@akashavyom.local"

    sabha_api_url: str = ""
    sabha_api_key: str = ""
    ecosystem_shared_auth: bool = False

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    rate_limit_per_minute: int = 120
    max_import_bytes: int = 5_242_880

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
