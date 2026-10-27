from pydantic import BaseModel
from typing import Optional, Dict

class SettingUpdate(BaseModel):
    key: str
    value: str

class SettingsOverview(BaseModel):
    environment: str
    demo_mode: bool
    default_baseline_model: str
    default_workspace_id: str
    exact_cache_ttl_seconds: int
    semantic_cache_enabled: bool
    semantic_cache_threshold: float
    configured_api_keys: Dict[str, bool] # {"openai": bool, "anthropic": bool, "gemini": bool, "groq": bool}
    database_type: str
    cache_backend: str
