from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DailySpendPoint(BaseModel):
    date: str # "YYYY-MM-DD"
    baseline_spend: float
    optimized_spend: float
    savings: float
    request_count: int

class ModelUsageBreakdown(BaseModel):
    model: str
    provider: str
    request_count: int
    percentage: float
    total_cost: float
    avg_latency_ms: float

class LatencyPercentiles(BaseModel):
    p50: float
    p90: float
    p95: float
    p99: float
    avg: float

class OverviewMetrics(BaseModel):
    total_spend_usd: float
    baseline_spend_usd: float
    total_savings_usd: float
    savings_percentage: float
    cost_per_successful_task: float
    total_requests: int
    successful_requests: int
    latency: LatencyPercentiles
    quality_pass_rate_pct: float
    cache_hit_rate_pct: float
    failure_rate_pct: float
    fallback_rate_pct: float
    verified_savings_usd: float
    estimated_savings_usd: float
    optimization_overhead_usd: float
    time_range: str
    is_demo: bool = True

class OverviewAnalyticsResponse(BaseModel):
    metrics: OverviewMetrics
    spend_chart: List[DailySpendPoint]
    model_breakdown: List[ModelUsageBreakdown]
    recent_savings_events: List[Dict[str, Any]]
