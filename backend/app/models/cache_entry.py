import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from backend.app.database import Base, utc_now

class CacheEntry(Base):
    __tablename__ = "cache_entries"

    cache_key = Column(String(64), primary_key=True) # SHA-256 fingerprint
    workspace_id = Column(String(64), default="ws_default", index=True)
    model = Column(String(64), nullable=False)
    prompt_hash = Column(String(64), nullable=False, index=True)
    prompt_preview = Column(String(512), nullable=False)
    response_content = Column(Text, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    cost_saved_per_hit = Column(Float, default=0.0)
    hit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    last_hit_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
