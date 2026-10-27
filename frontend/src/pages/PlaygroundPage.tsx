import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { PlaygroundCompareResponse } from '../types';

export const PlaygroundPage: React.FC = () => {
  const [prompt, setPrompt] = useState(
    "Classify the following customer ticket and extract urgency, issue_type, and suggested_action:\n'Our production database replica began dropping read connections around 03:40 UTC. Please escalate to a tier-3 engineer immediately.'"
  );
  const [systemInstruction, setSystemInstruction] = useState("You are an AIValueGuard optimized infrastructure assistant. Return clean, structured results.");
  const [context, setContext] = useState("");
  const [baselineModel, setBaselineModel] = useState("gpt-4o");
  const [optimizedMode, setOptimizedMode] = useState("auto");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [latencyBudget, setLatencyBudget] = useState<number | undefined>(600);
  const [jsonMode, setJsonMode] = useState(true);
  const [requiredFields, setRequiredFields] = useState("urgency, issue_type, suggested_action");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaygroundCompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSide, setCopiedSide] = useState<'baseline' | 'optimized' | null>(null);

  const handleRunComparison = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setError(null);

      const fieldsArray = requiredFields
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.comparePlayground({
        prompt,
        system_instruction: systemInstruction || undefined,
        context: context || undefined,
        baseline_model: baselineModel,
        optimized_model_mode: optimizedMode,
        temperature,
        max_tokens: maxTokens,
        latency_budget_ms: latencyBudget,
        json_mode: jsonMode,
        required_fields: fieldsArray
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Execution error during playground comparison');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, side: 'baseline' | 'optimized') => {
    navigator.clipboard.writeText(text);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Execution & Strategy Playground</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare unoptimized baseline model invocation against the AIValueGuard optimization pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPrompt("");
              setContext("");
              setResult(null);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </button>
          <button
            onClick={handleRunComparison}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50 transition"
          >
            <Play className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Executing Pipeline...' : 'Run Side-by-Side Comparison'}
          </button>
        </div>
      </div>

      {/* Inputs Configuration Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Baseline Model */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Baseline Model</label>
            <select
              value={baselineModel}
              onChange={(e) => setBaselineModel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-slate-800 focus:bg-white focus:outline-brand-500"
            >
              <option value="gpt-4o">OpenAI GPT-4o ($2.50 / $10.00)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet ($3.00 / $15.00)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro ($1.25 / $5.00)</option>
            </select>
          </div>

          {/* Optimized Mode */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optimized Strategy</label>
            <select
              value={optimizedMode}
              onChange={(e) => setOptimizedMode(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-slate-800 focus:bg-white focus:outline-brand-500"
            >
              <option value="auto">✨ AIValueGuard Intelligent Router (Auto)</option>
              <option value="gpt-4o-mini">Direct gpt-4o-mini</option>
              <option value="gemini-1.5-flash">Direct gemini-1.5-flash</option>
              <option value="llama-3.3-70b-versatile">Direct llama-3.3-70b (Groq)</option>
            </select>
          </div>

          {/* Latency Budget */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Latency Budget (ms)</label>
            <input
              type="number"
              value={latencyBudget || ''}
              onChange={(e) => setLatencyBudget(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 500ms"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 focus:bg-white focus:outline-brand-500 font-mono"
            />
          </div>

          {/* Temperature & Max tokens */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">Temp ({temperature})</label>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div className="w-20">
              <label className="block font-semibold text-slate-700 mb-1">Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">User Prompt</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-brand-500 font-mono"
          />
        </div>

        {/* Quality Checks & Context Expander */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                id="jsonCheck"
                checked={jsonMode}
                onChange={(e) => setJsonMode(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="jsonCheck" className="font-semibold text-slate-700 cursor-pointer">
                Validate JSON Structure & Required Keys
              </label>
            </div>
            <input
              type="text"
              value={requiredFields}
              onChange={(e) => setRequiredFields(e.target.value)}
              placeholder="Comma-separated required keys e.g. status, summary"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Optional Context <span className="font-normal text-slate-400">(will be auto-optimized)</span>
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Supplemental context or retrieved documentation..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Results Comparison Grid */}
      {result && (
        <div className="space-y-4">
          {/* Summary Verdict Bar */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Optimization Verified</h4>
                <p className="text-slate-600 mt-0.5">{result.comparison.verdict}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-400 font-sans">Cost Reduction</div>
                <div className="font-bold text-emerald-700 text-sm">
                  {result.comparison.savings_percentage}% (${result.comparison.cost_savings_usd.toFixed(5)})
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-400 font-sans">Speedup</div>
                <div className="font-bold text-indigo-700 text-sm">
                  {result.comparison.latency_speedup_pct}% ({result.comparison.latency_delta_ms}ms)
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Side-by-Side Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Baseline Result */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">Baseline Execution</span>
                    <Badge variant="neutral">{result.baseline.model}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">Unoptimized Direct Provider Call</p>
                </div>
                <button
                  onClick={() => copyToClipboard(result.baseline.content, 'baseline')}
                  className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Copy response"
                >
                  {copiedSide === 'baseline' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-center text-xs font-mono mb-4 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Cost</span>
                  <span className="font-bold text-slate-800">${result.baseline.cost_usd.toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Latency</span>
                  <span className="font-medium text-slate-800">{result.baseline.latency_ms}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Tokens</span>
                  <span className="font-medium text-slate-800">{result.baseline.total_tokens}</span>
                </div>
              </div>

              {/* Completion text */}
              <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96">
                {result.baseline.content}
              </div>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Quality check: {result.baseline.quality_passed ? 'Passed' : 'Failed'}</span>
                <span className="text-slate-400">TTFT: {result.baseline.ttft_ms ? `${result.baseline.ttft_ms}ms` : 'N/A'}</span>
              </div>
            </div>

            {/* Right: AIValueGuard Optimized Result */}
            <div className="rounded-xl border border-brand-200 bg-white p-5 shadow-xs flex flex-col ring-1 ring-brand-100">
              <div className="flex items-center justify-between border-b border-brand-100 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">AIValueGuard Pipeline</span>
                    <Badge variant={result.optimized.is_cached ? 'cached' : 'success'}>
                      {result.optimized.is_cached ? 'CACHED' : result.optimized.model}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-brand-600 font-medium">Routed, Optimized & Quality Checked</p>
                </div>
                <button
                  onClick={() => copyToClipboard(result.optimized.content, 'optimized')}
                  className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Copy response"
                >
                  {copiedSide === 'optimized' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-50/70 rounded-lg p-2.5 text-center text-xs font-mono mb-4 border border-indigo-100">
                <div>
                  <span className="text-[10px] text-indigo-700 block font-sans">Optimized Cost</span>
                  <span className="font-bold text-emerald-700">${result.optimized.cost_usd.toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700 block font-sans">Latency</span>
                  <span className="font-bold text-indigo-900">{result.optimized.latency_ms}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700 block font-sans">Tokens</span>
                  <span className="font-medium text-slate-800">{result.optimized.total_tokens}</span>
                </div>
              </div>

              {/* Completion text */}
              <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-96">
                {result.optimized.content}
              </div>

              {/* Routing & Quality Footer */}
              <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{result.optimized.routing_reason}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
