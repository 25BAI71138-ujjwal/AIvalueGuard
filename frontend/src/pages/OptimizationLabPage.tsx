import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { ExperimentDetail, ExperimentItem } from '../types';

export const OptimizationLabPage: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [activeExperiment, setActiveExperiment] = useState<ExperimentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // New experiment form
  const [expName, setExpName] = useState("Enterprise Benchmark Run #1");
  const [datasetName, setDatasetName] = useState("Support & Code Benchmark");
  const [baselineModel, setBaselineModel] = useState("gpt-4o");
  const [optimizedPolicy, setOptimizedPolicy] = useState("balanced_cost_quality");
  const [sampleSize, setSampleSize] = useState(5);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const res = await api.getExperiments();
      setExperiments(res);
      if (res.length > 0 && !activeExperiment) {
        const detail = await api.getExperimentDetail(res[0].id);
        setActiveExperiment(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleRunExperiment = async () => {
    try {
      setRunning(true);
      const result = await api.createExperiment({
        name: expName,
        dataset_name: datasetName,
        baseline_model: baselineModel,
        optimized_policy: optimizedPolicy,
        sample_size: sampleSize
      });
      setActiveExperiment(result);
      await loadExperiments();
    } catch (e: any) {
      alert(`Experiment error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSelectExperiment = async (id: string) => {
    try {
      const detail = await api.getExperimentDetail(id);
      setActiveExperiment(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const exportResultsJSON = () => {
    if (!activeExperiment) return;
    const blob = new Blob([JSON.stringify(activeExperiment, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeExperiment.id}_results.json`;
    a.click();
  };

  const exportResultsCSV = () => {
    if (!activeExperiment) return;
    const headers = ['Case ID', 'Category', 'Baseline Model', 'Optimized Model', 'Baseline Cost ($)', 'Optimized Cost ($)', 'Savings (%)', 'Baseline Latency (ms)', 'Optimized Latency (ms)', 'Baseline Passed', 'Optimized Passed', 'Cached'];
    const rows = activeExperiment.items.map(i => [
      i.case_id,
      i.category,
      i.baseline_model,
      i.optimized_model,
      i.baseline_cost.toFixed(6),
      i.optimized_cost.toFixed(6),
      i.savings_pct,
      i.baseline_latency_ms,
      i.optimized_latency_ms,
      i.baseline_passed,
      i.optimized_passed,
      i.is_cached
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeExperiment.id}_results.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Optimization Laboratory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Run deterministic side-by-side experiment suites on production datasets to mathematically evaluate cost vs quality tradeoffs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeExperiment && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportResultsCSV}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                onClick={exportResultsJSON}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Download className="h-3.5 w-3.5" /> Export JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Experiment Runner Config Card */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Launch New Comparative Experiment</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">A/B Strategy Evaluation Suite</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Experiment Label</label>
            <input
              type="text"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Benchmark Dataset</label>
            <select
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-800"
            >
              <option value="Support & Code Benchmark">Support & Code Benchmark (10 cases)</option>
              <option value="Customer Sentiment Batch">Customer Sentiment Batch (10 cases)</option>
              <option value="Entity Extraction Suite">Entity Extraction Suite (10 cases)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Baseline Model</label>
            <select
              value={baselineModel}
              onChange={(e) => setBaselineModel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-slate-800"
            >
              <option value="gpt-4o">OpenAI GPT-4o ($2.50 / $10.00)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet ($3.00 / $15.00)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro ($1.25 / $5.00)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optimization Policy</label>
            <select
              value={optimizedPolicy}
              onChange={(e) => setOptimizedPolicy(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-800"
            >
              <option value="balanced_cost_quality">Balanced Cost & Quality (Default)</option>
              <option value="aggressive_cost">Aggressive Cost Minimization</option>
              <option value="latency_prioritized">Strict Latency Prioritization</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sample Size: {sampleSize}</label>
            <input
              type="range"
              min="3"
              max="10"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunExperiment}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50 transition"
          >
            <Play className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
            {running ? `Running Suite (${sampleSize} test cases)...` : 'Execute Experiment'}
          </button>
        </div>
      </div>

      {/* Active Experiment Summary KPIs */}
      {activeExperiment && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Comparative Savings"
              value={`${activeExperiment.savings_percentage}%`}
              subtext={`$${activeExperiment.optimized_total_cost.toFixed(5)} vs $${activeExperiment.baseline_total_cost.toFixed(5)}`}
              trend={{ value: "Audited Metric", positive: true }}
              icon={TrendingDown}
            />

            <StatCard
              label="Quality Integrity"
              value={`${activeExperiment.optimized_quality_pass_rate}%`}
              subtext={`Baseline was ${activeExperiment.baseline_quality_pass_rate}%`}
              trend={{ value: "Zero Quality Degradation", positive: true }}
              icon={CheckCircle2}
            />

            <StatCard
              label="Average Latency"
              value={`${activeExperiment.optimized_avg_latency_ms}ms`}
              subtext={`vs ${activeExperiment.baseline_avg_latency_ms}ms baseline`}
              trend={{ value: "Faster Response", positive: true }}
              icon={Clock}
            />

            <StatCard
              label="Cache Hit Rate"
              value={`${activeExperiment.cache_hit_rate}%`}
              subtext={`${activeExperiment.total_test_cases} test cases executed`}
              icon={Database}
            />
          </div>

          {/* Test Case Inspection Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{activeExperiment.name}</h3>
                <p className="text-xs text-slate-500">
                  Dataset: {activeExperiment.dataset_name} | Baseline: {activeExperiment.baseline_model}
                </p>
              </div>
              <Badge variant="success">Completed</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Prompt Preview</th>
                    <th className="py-3 px-4">Routed Model</th>
                    <th className="py-3 px-4 text-right">Baseline Cost</th>
                    <th className="py-3 px-4 text-right">Optimized Cost</th>
                    <th className="py-3 px-4 text-right">Savings %</th>
                    <th className="py-3 px-4 text-right">Latency Delta</th>
                    <th className="py-3 px-4 text-center">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeExperiment.items.map((item) => (
                    <tr key={item.case_id} className="hover:bg-slate-50/70 transition font-sans">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.case_id}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={item.prompt_preview}>
                        {item.prompt_preview}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-indigo-700">{item.optimized_model}</span>
                        {item.is_cached && <span className="ml-1 text-[10px] text-brand-600 font-bold">(Cached)</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ${item.baseline_cost.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ${item.optimized_cost.toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {item.savings_pct}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {item.baseline_latency_ms}ms → {item.optimized_latency_ms}ms
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.optimized_passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
