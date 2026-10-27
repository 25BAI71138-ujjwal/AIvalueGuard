from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.app.schemas.gateway import GatewayChatResponse

class PlaygroundCompareRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None
    context: Optional[str] = None
    baseline_model: str = "gpt-4o"
    optimized_model_mode: str = "auto" # "auto" or specific model
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=800, ge=1)
    latency_budget_ms: Optional[int] = None
    json_mode: bool = False
    required_fields: Optional[List[str]] = Field(default_factory=list)
    workspace_id: str = "ws_default"

class ExecutionResult(BaseModel):
    model: str
    provider: str
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: float
    ttft_ms: Optional[float] = None
    is_cached: bool
    quality_passed: bool
    quality_details: List[str]
    routing_reason: Optional[str] = None

class PlaygroundComparisonSummary(BaseModel):
    cost_savings_usd: float
    savings_percentage: float
    latency_delta_ms: float
    latency_speedup_pct: float
    token_delta: int
    quality_preserved: bool
    verdict: str

class PlaygroundCompareResponse(BaseModel):
    baseline: ExecutionResult
    optimized: ExecutionResult
    comparison: PlaygroundComparisonSummary
    request_id: str
    is_demo: bool = True
