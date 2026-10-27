export interface ModelConfig {
  id: string;
  provider: string;
  display_name: string;
  input_cost_per_m: number;
  output_cost_per_m: number;
  context_window: number;
  max_output_tokens: number;
  latency_estimate_ms: number;
  quality_score: number;
  supports_json: boolean;
  supports_tools: boolean;
  supports_vision: boolean;
  priority: number;
  is_enabled: boolean;
  is_default_baseline: boolean;
  pricing_source: string;
  updated_at?: string;
}

export interface RequestItem {
  id: string;
  timestamp: string;
  prompt_preview: string;
  model_selected: string;
  baseline_model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  ttft_ms?: number;
  actual_cost_usd: number;
  baseline_cost_usd: number;
  saved_cost_usd: number;
  savings_percentage: number;
  is_cached: boolean;
  cache_type: string;
  quality_passed: boolean;
  quality_checks_run: number;
  status: string;
  is_demo: boolean;
}

export interface RequestDetail {
  id: string;
  workspace_id: string;
  timestamp: string;
  prompt_preview: string;
  system_instruction?: string;
  temperature: number;
  model_selected: string;
  baseline_model: string;
  provider: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
    raw_context: number;
    optimized_context: number;
    saved_context: number;
  };
  performance: {
    latency_ms: number;
    ttft_ms?: number;
  };
  financials: {
    actual_cost_usd: number;
    baseline_cost_usd: number;
    saved_cost_usd: number;
    savings_percentage: number;
    optimization_overhead_usd: number;
  };
  cache: {
    is_cached: boolean;
    cache_type: string;
  };
  quality: {
    passed: boolean;
    checks_run: number;
    details_json: string;
  };
  routing: {
    reason: string;
    decision_json: string;
    fallbacks_used_json: string;
  };
  status: string;
  error_message?: string;
  is_demo: boolean;
}

export interface OverviewMetrics {
  total_spend_usd: number;
  baseline_spend_usd: number;
  total_savings_usd: number;
  savings_percentage: number;
  cost_per_successful_task: number;
  total_requests: number;
  successful_requests: number;
  latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
  };
  quality_pass_rate_pct: number;
  cache_hit_rate_pct: number;
  failure_rate_pct: number;
  fallback_rate_pct: number;
  verified_savings_usd: number;
  estimated_savings_usd: number;
  optimization_overhead_usd: number;
  time_range: string;
  is_demo: boolean;
}

export interface DailySpendPoint {
  date: string;
  baseline_spend: number;
  optimized_spend: number;
  savings: number;
  request_count: number;
}

export interface ModelUsageBreakdown {
  model: string;
  provider: string;
  request_count: number;
  percentage: number;
  total_cost: number;
  avg_latency_ms: number;
}

export interface OverviewData {
  metrics: OverviewMetrics;
  spend_chart: DailySpendPoint[];
  model_breakdown: ModelUsageBreakdown[];
  recent_savings_events: Array<{
    request_id: string;
    timestamp: string;
    model_selected: string;
    baseline_model: string;
    saved_usd: number;
    savings_pct: number;
    reason: string;
    status: string;
  }>;
}

export interface CacheStats {
  total_entries: number;
  active_entries: number;
  total_hits: number;
  total_misses: number;
  hit_rate_percentage: number;
  total_cost_saved_usd: number;
  total_tokens_saved: number;
  cache_memory_mode: string;
  ttl_seconds: number;
}

export interface CacheEntryItem {
  cache_key: string;
  workspace_id: string;
  model: string;
  prompt_preview: string;
  response_content: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_saved_per_hit: number;
  hit_count: number;
  created_at: string;
  last_hit_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface EvaluationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: string;
  parameters_json: string;
  severity: string;
  is_active: boolean;
  pass_count: number;
  fail_count: number;
  pass_rate_pct: number;
  updated_at?: string;
}

export interface PlaygroundExecutionResult {
  model: string;
  provider: string;
  content: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  ttft_ms?: number;
  is_cached: boolean;
  quality_passed: boolean;
  quality_details: string[];
  routing_reason?: string;
}

export interface PlaygroundCompareResponse {
  baseline: PlaygroundExecutionResult;
  optimized: PlaygroundExecutionResult;
  comparison: {
    cost_savings_usd: number;
    savings_percentage: number;
    latency_delta_ms: number;
    latency_speedup_pct: number;
    token_delta: number;
    quality_preserved: boolean;
    verdict: string;
  };
  request_id: string;
  is_demo: boolean;
}

export interface ExperimentItem {
  case_id: string;
  prompt_preview: string;
  category: string;
  baseline_model: string;
  optimized_model: string;
  baseline_cost: number;
  optimized_cost: number;
  savings_pct: number;
  baseline_latency_ms: number;
  optimized_latency_ms: number;
  baseline_passed: boolean;
  optimized_passed: boolean;
  is_cached: boolean;
  fallback_used: boolean;
}

export interface ExperimentDetail {
  id: string;
  name: string;
  dataset_name: string;
  baseline_model: string;
  optimized_policy: string;
  total_test_cases: number;
  completed_test_cases: number;
  baseline_total_cost: number;
  optimized_total_cost: number;
  savings_percentage: number;
  baseline_avg_latency_ms: number;
  optimized_avg_latency_ms: number;
  baseline_quality_pass_rate: number;
  optimized_quality_pass_rate: number;
  cache_hit_rate: number;
  status: string;
  created_at: string;
  items: ExperimentItem[];
}

export interface SettingsData {
  environment: string;
  demo_mode: boolean;
  default_baseline_model: string;
  default_workspace_id: string;
  exact_cache_ttl_seconds: number;
  semantic_cache_enabled: boolean;
  semantic_cache_threshold: number;
  configured_api_keys: Record<string, boolean>;
  database_type: string;
  cache_backend: string;
}
