import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from backend.app.database import Base, utc_now

class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(String(64), primary_key=True) # e.g. "req_01j7xyz..."
    workspace_id = Column(String(64), default="ws_default", index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    
    # Prompt & Request metadata
    prompt_preview = Column(String(512), nullable=False)
    system_instruction = Column(Text, nullable=True)
    temperature = Column(Float, default=0.7)
    
    # Execution details
    model_selected = Column(String(64), nullable=False, index=True)
    baseline_model = Column(String(64), nullable=False)
    provider = Column(String(32), nullable=False, index=True)
    
    # Tokens
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    raw_context_tokens = Column(Integer, default=0)
    optimized_context_tokens = Column(Integer, default=0)
    tokens_saved_context = Column(Integer, default=0)
    
    # Performance & Cost
    latency_ms = Column(Float, default=0.0)
    ttft_ms = Column(Float, nullable=True)
    actual_cost_usd = Column(Float, default=0.0)
    baseline_cost_usd = Column(Float, default=0.0)
    saved_cost_usd = Column(Float, default=0.0)
    savings_percentage = Column(Float, default=0.0)
    optimization_overhead_usd = Column(Float, default=0.0)
    
    # Caching & Quality
    is_cached = Column(Boolean, default=False, index=True)
    cache_type = Column(String(32), default="none") # none, exact, semantic
    quality_passed = Column(Boolean, default=True, index=True)
    quality_checks_run = Column(Integer, default=0)
    quality_details_json = Column(Text, default="{}")
    
    # Trace & Status
    routing_reason = Column(Text, nullable=True)
    routing_decision_json = Column(Text, default="{}")
    fallbacks_used_json = Column(Text, default="[]")
    status = Column(String(32), default="success", index=True) # success, cached, fallback_success, quality_failed, error
    error_message = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True, index=True) # Labeled Demo vs Real
    
    # Task-Level Tracking & Attribution
    task_name = Column(String(128), default="General Task", nullable=True, index=True)
    project_name = Column(String(128), default="Default Project", nullable=True, index=True)
    session_id = Column(String(128), nullable=True, index=True)
