from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CacheEntryRead(BaseModel):
    cache_key: str
    workspace_id: str
    model: str
    prompt_hash: str
    prompt_preview: str
    response_content: str
    prompt_tokens: int
    completion_tokens: int
    cost_saved_per_hit: float
    hit_count: int
    created_at: datetime
    last_hit_at: datetime
    expires_at: datetime
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class CacheStats(BaseModel):
    total_entries: int
    active_entries: int
    total_hits: int
    total_misses: int
    hit_rate_percentage: float
    total_cost_saved_usd: float
    total_tokens_saved: int
    cache_memory_mode: str # "In-Memory LRU" or "Redis Server"
    ttl_seconds: int

class CacheInvalidateRequest(BaseModel):
    workspace_id: Optional[str] = "ws_default"
    model: Optional[str] = None
    cache_key: Optional[str] = None
