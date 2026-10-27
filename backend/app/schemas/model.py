from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ModelConfigBase(BaseModel):
    id: str
    provider: str
    display_name: str
    input_cost_per_m: float
    output_cost_per_m: float
    context_window: int = 128000
    max_output_tokens: int = 4096
    latency_estimate_ms: int = 500
    quality_score: float = 0.85
    supports_json: bool = True
    supports_tools: bool = True
    supports_vision: bool = False
    priority: int = 1
    is_enabled: bool = True
    is_default_baseline: bool = False
    pricing_source: str = "Official Provider Pricing 2026"

class ModelConfigCreate(ModelConfigBase):
    pass

class ModelConfigUpdate(BaseModel):
    display_name: Optional[str] = None
    input_cost_per_m: Optional[float] = None
    output_cost_per_m: Optional[float] = None
    context_window: Optional[int] = None
    max_output_tokens: Optional[int] = None
    latency_estimate_ms: Optional[int] = None
    quality_score: Optional[float] = None
    supports_json: Optional[bool] = None
    supports_tools: Optional[bool] = None
    supports_vision: Optional[bool] = None
    priority: Optional[int] = None
    is_enabled: Optional[bool] = None
    is_default_baseline: Optional[bool] = None

class ModelConfigRead(ModelConfigBase):
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
