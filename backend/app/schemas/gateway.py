from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str # "system", "user", "assistant"
    content: str

class GatewayChatRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    system_instruction: Optional[str] = None
    context: Optional[str] = None
    model: Optional[str] = "auto" # "auto" or specific model id e.g. "gpt-4o-mini"
    baseline_model: Optional[str] = "gpt-4o"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=1024, ge=1)
    latency_budget_ms: Optional[int] = None
    required_capabilities: Optional[List[str]] = Field(default_factory=list) # e.g. ["json", "tools"]
    quality_checks: Optional[List[str]] = Field(default_factory=list)
    optimize: bool = True
    allow_cache: bool = True
    workspace_id: str = "ws_default"
    tenant_id: Optional[str] = None

class ContextReductionMeta(BaseModel):
    raw_tokens: int
    optimized_tokens: int
    saved_tokens: int
    reduction_percentage: float
    strategy_applied: str

class QualityCheckDetail(BaseModel):
    rule_name: str
    passed: bool
    score: float
    details: str

class QualityEvaluationMeta(BaseModel):
    passed: bool
    checks_run: int
    checks_passed: int
    details: List[QualityCheckDetail]

class RoutingDecisionMeta(BaseModel):
    selected_model: str
    reason: str
    evaluated_models_count: int
    eligible_models_count: int
    estimated_cost_ratio: float
    latency_estimate_ms: int

class GatewayChatResponse(BaseModel):
    request_id: str
    model_used: str
    baseline_model: str
    provider: str
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    baseline_cost_usd: float
    saved_cost_usd: float
    savings_percentage: float
    latency_ms: float
    ttft_ms: Optional[float] = None
    is_cached: bool
    cache_type: str # none, exact, semantic
    routing_decision: RoutingDecisionMeta
    quality_eval: QualityEvaluationMeta
    context_reduction: ContextReductionMeta
    fallbacks_used: List[str] = Field(default_factory=list)
    optimization_overhead_usd: float = 0.0
    status: str
    is_demo: bool = True
