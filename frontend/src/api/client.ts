import {
  OverviewData,
  RequestItem,
  RequestDetail,
  ModelConfig,
  CacheStats,
  CacheEntryItem,
  EvaluationRule,
  PlaygroundCompareResponse,
  ExperimentDetail,
  SettingsData
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.text();
    let message = `API request failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) message = parsed.detail;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  // Overview & Analytics
  async getOverview(workspaceId = 'ws_default', timeRange = '7d'): Promise<OverviewData> {
    const res = await fetch(`${BASE_URL}/analytics/overview?workspace_id=${workspaceId}&time_range=${timeRange}`);
    return handleResponse<OverviewData>(res);
  },

  async getCostAnalytics(workspaceId = 'ws_default', timeRange = '30d') {
    const res = await fetch(`${BASE_URL}/analytics/costs?workspace_id=${workspaceId}&time_range=${timeRange}`);
    return handleResponse<any>(res);
  },

  // Gateway Requests
  async getRequests(params: {
    search?: string;
    status?: string;
    model?: string;
    is_cached?: boolean;
    workspace_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; limit: number; offset: number; items: RequestItem[] }> {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.model) q.append('model', params.model);
    if (params.is_cached !== undefined) q.append('is_cached', String(params.is_cached));
    q.append('workspace_id', params.workspace_id || 'ws_default');
    q.append('limit', String(params.limit || 50));
    q.append('offset', String(params.offset || 0));

    const res = await fetch(`${BASE_URL}/requests?${q.toString()}`);
    return handleResponse(res);
  },

  async getRequestDetail(id: string): Promise<RequestDetail> {
    const res = await fetch(`${BASE_URL}/requests/${id}`);
    return handleResponse<RequestDetail>(res);
  },

  // Playground
  async comparePlayground(data: {
    prompt: string;
    system_instruction?: string;
    context?: string;
    baseline_model?: string;
    optimized_model_mode?: string;
    temperature?: number;
    max_tokens?: number;
    latency_budget_ms?: number;
    json_mode?: boolean;
    required_fields?: string[];
  }): Promise<PlaygroundCompareResponse> {
    const res = await fetch(`${BASE_URL}/playground/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<PlaygroundCompareResponse>(res);
  },

  // Models
  async getModels(): Promise<ModelConfig[]> {
    const res = await fetch(`${BASE_URL}/models`);
    return handleResponse<ModelConfig[]>(res);
  },

  async updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    const res = await fetch(`${BASE_URL}/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<ModelConfig>(res);
  },

  async simulateRoute(params: {
    prompt_tokens?: number;
    expected_completion_tokens?: number;
    latency_budget_ms?: number;
    required_capabilities?: string[];
    min_quality_score?: number;
    baseline_model_id?: string;
    prompt_text?: string;
  }): Promise<{ selected_model: ModelConfig; decision: { selected_model: string; reason: string; estimated_cost_ratio: number; latency_estimate_ms: number }; fallbacks: string[] }> {
    const res = await fetch(`${BASE_URL}/models/simulate-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  // Cache
  async getCacheStats(workspaceId = 'ws_default'): Promise<CacheStats> {
    const res = await fetch(`${BASE_URL}/cache/stats?workspace_id=${workspaceId}`);
    return handleResponse<CacheStats>(res);
  },

  async getCacheEntries(workspaceId = 'ws_default'): Promise<CacheEntryItem[]> {
    const res = await fetch(`${BASE_URL}/cache/entries?workspace_id=${workspaceId}`);
    return handleResponse<CacheEntryItem[]>(res);
  },

  async invalidateCache(data: { workspace_id?: string; model?: string; cache_key?: string }) {
    const res = await fetch(`${BASE_URL}/cache/invalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<{ status: string; invalidated_count: number; message: string }>(res);
  },

  // Quality Evaluations
  async getEvaluationRules(): Promise<EvaluationRule[]> {
    const res = await fetch(`${BASE_URL}/evaluations/rules`);
    return handleResponse<EvaluationRule[]>(res);
  },

  async updateEvaluationRule(id: string, updates: Partial<EvaluationRule>): Promise<EvaluationRule> {
    const res = await fetch(`${BASE_URL}/evaluations/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<EvaluationRule>(res);
  },

  async runEvaluationTest(content: string) {
    const res = await fetch(`${BASE_URL}/evaluations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return handleResponse<any>(res);
  },

  // Optimization Lab Experiments
  async getExperiments(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/experiments`);
    return handleResponse<any[]>(res);
  },

  async getBenchmarkCases(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/experiments/benchmark-cases`);
    return handleResponse<any[]>(res);
  },

  async createExperiment(data: {
    name: string;
    dataset_name?: string;
    baseline_model?: string;
    optimized_policy?: string;
    sample_size?: number;
    custom_dataset?: any[];
  }): Promise<ExperimentDetail> {
    const res = await fetch(`${BASE_URL}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<ExperimentDetail>(res);
  },

  async getExperimentDetail(id: string): Promise<ExperimentDetail> {
    const res = await fetch(`${BASE_URL}/experiments/${id}`);
    return handleResponse<ExperimentDetail>(res);
  },

  // Settings
  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse<SettingsData>(res);
  },

  async toggleDemoMode(): Promise<{ status: string; demo_mode: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/settings/toggle-demo`, { method: 'POST' });
    return handleResponse<{ status: string; demo_mode: boolean; message: string }>(res);
  },

  async updateSetting(key: string, value: string) {
    const res = await fetch(`${BASE_URL}/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    return handleResponse<{ status: string; message: string }>(res);
  },

  // AI Task Execution & 3D Live Token Tracker
  async executeTask(data: {
    prompt: string;
    model?: string;
    task_name?: string;
    project_name?: string;
    session_id?: string;
    temperature?: number;
    max_tokens?: number;
    system_instruction?: string;
    workspace_id?: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/gateway/task-execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },

  async getTaskAnalytics(workspaceId = 'ws_default'): Promise<any> {
    const res = await fetch(`${BASE_URL}/analytics/tasks?workspace_id=${workspaceId}`);
    return handleResponse<any>(res);
  },

  async getBudget(workspaceId = 'ws_default'): Promise<any> {
    const res = await fetch(`${BASE_URL}/budget?workspace_id=${workspaceId}`);
    return handleResponse<any>(res);
  },

  async updateBudget(data: any, workspaceId = 'ws_default'): Promise<any> {
    const res = await fetch(`${BASE_URL}/budget?workspace_id=${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },

  async getWasteAndOptimizations(workspaceId = 'ws_default'): Promise<any> {
    const res = await fetch(`${BASE_URL}/analytics/waste-and-optimizations?workspace_id=${workspaceId}`);
    return handleResponse<any>(res);
  },

  getExportUrl(format = 'csv', workspaceId = 'ws_default'): string {
    return `${BASE_URL}/requests/export?format=${format}&workspace_id=${workspaceId}`;
  }
};

