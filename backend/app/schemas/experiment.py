from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ExperimentTestCase(BaseModel):
    id: str
    prompt: str
    system_instruction: Optional[str] = None
    context: Optional[str] = None
    expected_contains: Optional[str] = None
    category: str = "general"

class ExperimentCreateRequest(BaseModel):
    name: str
    dataset_name: str = "Support & Code Benchmark"
    baseline_model: str = "gpt-4o"
    optimized_policy: str = "balanced_cost_quality" # balanced_cost_quality | aggressive_cost | latency_prioritized
    sample_size: int = 10
    custom_dataset: Optional[List[ExperimentTestCase]] = None

class ExperimentItemResult(BaseModel):
    case_id: str
    prompt_preview: str
    category: str
    baseline_model: str
    optimized_model: str
    baseline_cost: float
    optimized_cost: float
    savings_pct: float
    baseline_latency_ms: float
    optimized_latency_ms: float
    baseline_passed: bool
    optimized_passed: bool
    is_cached: bool
    fallback_used: bool

class ExperimentDetailResponse(BaseModel):
    id: str
    name: str
    dataset_name: str
    baseline_model: str
    optimized_policy: str
    total_test_cases: int
    completed_test_cases: int
    baseline_total_cost: float
    optimized_total_cost: float
    savings_percentage: float
    baseline_avg_latency_ms: float
    optimized_avg_latency_ms: float
    baseline_quality_pass_rate: float
    optimized_quality_pass_rate: float
    cache_hit_rate: float
    status: str
    created_at: datetime
    items: List[ExperimentItemResult]
