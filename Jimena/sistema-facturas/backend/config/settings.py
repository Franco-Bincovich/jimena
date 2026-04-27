from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_secret_key: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    anthropic_api_key: str = ""
    oauthlib_insecure_transport: str = "1"
    vite_api_url: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
