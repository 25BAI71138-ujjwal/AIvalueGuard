import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from backend.app.database import Base

class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(String(64), primary_key=True) # e.g. "gpt-4o-mini"
    provider = Column(String(32), nullable=False) # "openai", "anthropic", "google", "groq"
    display_name = Column(String(128), nullable=False)
    input_cost_per_m = Column(Float, nullable=False) # USD per 1M tokens
    output_cost_per_m = Column(Float, nullable=False) # USD per 1M tokens
    context_window = Column(Integer, default=128000)
    max_output_tokens = Column(Integer, default=4096)
    latency_estimate_ms = Column(Integer, default=500)
    quality_score = Column(Float, default=0.85) # benchmark score 0.0 - 1.0
    supports_json = Column(Boolean, default=True)
    supports_tools = Column(Boolean, default=True)
    supports_vision = Column(Boolean, default=False)
    priority = Column(Integer, default=1)
    is_enabled = Column(Boolean, default=True)
    is_default_baseline = Column(Boolean, default=False)
    pricing_source = Column(String(128), default="Official Provider Pricing 2026")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
