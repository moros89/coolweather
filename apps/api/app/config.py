from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="COOLWEATHER_", env_file=".env", extra="ignore")

    app_name: str = "CoolWeather API"
    database_url: str = "sqlite:///./coolweather.db"
    geocoding_base_url: str = "https://geocoding-api.open-meteo.com/v1"
    forecast_base_url: str = "https://api.open-meteo.com/v1"
    archive_base_url: str = "https://archive-api.open-meteo.com/v1"
    forecast_cache_ttl_seconds: int = 600
    geocode_cache_ttl_seconds: int = 86400


settings = Settings()
