"""Application configuration using Pydantic settings."""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql://where2meet:where2meet@localhost:5432/where2meet"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    EVENT_LINK_EXPIRY_HOURS: int = 720  # 30 days

    # Google Maps API
    GOOGLE_MAPS_API_KEY: str = ""

    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4000", "http://localhost:3000"]

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse ALLOWED_ORIGINS from JSON string or comma-separated string."""
        if isinstance(v, str):
            # Try JSON first
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # If JSON fails, try comma-separated values
                if ',' in v:
                    return [origin.strip() for origin in v.split(',') if origin.strip()]
                else:
                    return [v.strip()]
        return v

    # Data Lifecycle
    EVENT_TTL_DAYS: int = 30
    SOFT_DELETE_RETENTION_DAYS: int = 7

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
