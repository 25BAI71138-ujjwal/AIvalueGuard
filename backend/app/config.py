import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIValueGuard"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment & Demo Mode
    ENVIRONMENT: str = "development" # development | staging | production
    DEMO_MODE: bool = True # Defaults to Demo Mode for hackathon readiness without mandatory keys
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./aivalueguard.db"
    
    # Redis / In-memory fallback
    REDIS_URL: Optional[str] = None # e.g. redis://localhost:6379/0
    
    # Security & Keys
    SECRET_KEY: str = "aivalueguard-secret-key-change-in-production"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    # Provider API Keys (server-side only)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # Optimization Engine Defaults
    DEFAULT_BASELINE_MODEL: str = "gpt-4o"
    DEFAULT_WORKSPACE_ID: str = "ws_default"
    EXACT_CACHE_TTL_SECONDS: int = 86400 # 24 hours
    SEMANTIC_CACHE_THRESHOLD: float = 0.92
    OPTIMIZATION_OVERHEAD_MS: float = 8.5 # realistic micro-overhead for routing + cache check in ms
    OPTIMIZATION_OVERHEAD_COST: float = 0.00002 # ~$0.02 per 1000 requests internal gateway processing

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
