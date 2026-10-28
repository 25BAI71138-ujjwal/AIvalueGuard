import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Plus,
  RefreshCw,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { ModelConfig } from '../types';

export const ModelsRoutingPage: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModelConfig>>({});
  const [saving, setSaving] = useState(false);

  // Router test simulator state
  const [simTokens, setSimTokens] = useState(300);
  const [simBudget, setSimBudget] = useState(400);
  const [simJson, setSimJson] = useState(true);
  const [simVision, setSimVision] = useState(false);
  const [simResult, setSimResult] = useState<{
    selected_model: ModelConfig;
    decision: { selected_model: string; reason: string; estimated_cost_ratio: number; latency_estimate_ms: number };
    fallbacks: string[];
  } | null>(null);

  const loadModels = async () => {
    try {
      setLoading(true);
      const res = await api.getModels();
      setModels(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleStartEdit = (m: ModelConfig) => {
    setEditingId(m.id);
    setEditForm({
      display_name: m.display_name,
      input_cost_per_m: m.input_cost_per_m,
      output_cost_per_m: m.output_cost_per_m,
      latency_estimate_ms: m.latency_estimate_ms,
      quality_score: m.quality_score,
      priority: m.priority,
      is_enabled: m.is_enabled
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setSaving(true);
      const updated = await api.updateModel(id, editForm);
      setModels(models.map(m => m.id === id ? updated : m));
      setEditingId(null);
    } catch (e) {
      alert("Failed to update model configuration");
    } finally {
      setSaving(false);
    }
  };

  // Run backend multi-criteria routing simulation whenever simulator controls change
  useEffect(() => {
    let active = true;
    const runSimulation = async () => {
      try {
        const caps: string[] = [];
        if (simJson) caps.push("json");
        if (simVision) caps.push("vision");

        const res = await api.simulateRoute({
          prompt_tokens: simTokens,
          latency_budget_ms: simBudget,
          required_capabilities: caps,
          baseline_model_id: "gpt-4o"
        });
        if (active) {
          setSimResult(res);
        }
      } catch (err) {
        console.error("Simulation error:", err);
      }
    };
    runSimulation();
    return () => {
      active = false;
    };
  }, [simTokens, simBudget, simJson, simVision, models]);

  const bestSimulatedModel = simResult?.selected_model || models.find(m => m.is_enabled);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading tracking-wide uppercase font-bold text-white flex items-center gap-2">
            Models Catalog & Multi-Criteria Router
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure provider pricing per 1M tokens, latency constraints, benchmark quality thresholds, and routing priorities
          </p>
        </div>

        <button
          onClick={loadModels}
          className="flex items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white transition shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Catalog
        </button>
      </div>

      {/* Interactive Router Simulator Card */}
      <div className="rounded-xl border border-cyan-500/30 bg-obsidian-card p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-obsidian-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">Routing Engine Real-Time Decision Simulator</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Constraint satisfaction algorithm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Prompt Length ({simTokens} tok)</label>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={simTokens}
              onChange={(e) => setSimTokens(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Latency SLA ({simBudget}ms)</label>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={simBudget}
              onChange={(e) => setSimBudget(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-500"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-300">
              <input
                type="checkbox"
                checked={simJson}
                onChange={(e) => setSimJson(e.target.checked)}
                className="rounded accent-cyan-400 h-4 w-4"
              />
              Require JSON
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-300">
              <input
                type="checkbox"
                checked={simVision}
                onChange={(e) => setSimVision(e.target.checked)}
                className="rounded accent-cyan-400 h-4 w-4"
              />
              Require Vision
            </label>
          </div>

          {/* Outcome prediction box */}
          <div className="bg-obsidian-850 rounded-xl p-3 border border-obsidian-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans">Predicted Selection</span>
                <span className="font-mono font-bold text-white text-sm">
                  {bestSimulatedModel ? bestSimulatedModel.id : 'No eligible model'}
                </span>
              </div>
              {bestSimulatedModel && (
                <Badge variant="success">
                  ${(bestSimulatedModel.input_cost_per_m + bestSimulatedModel.output_cost_per_m).toFixed(2)}/1M
                </Badge>
              )}
            </div>
            {simResult?.decision && (
              <div className="mt-2 text-[10px] text-slate-400 truncate" title={simResult.decision.reason}>
                {simResult.decision.reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Catalog Table */}
      <div className="rounded-xl border border-obsidian-border bg-obsidian-card shadow-lg shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-obsidian-850/80 border-b border-obsidian-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Model & Provider</th>
                <th className="py-3 px-4 text-right">Input ($/1M)</th>
                <th className="py-3 px-4 text-right">Output ($/1M)</th>
                <th className="py-3 px-4 text-right">Context Win</th>
                <th className="py-3 px-4 text-right">Latency Est</th>
                <th className="py-3 px-4 text-center">Quality Score</th>
                <th className="py-3 px-4 text-center">Capabilities</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/50">
              {models.map((m) => {
                const isEditing = editingId === m.id;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white font-mono">{m.display_name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans mt-0.5">
                          <span className="capitalize">{m.provider}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{m.id}</span>
                          {m.is_default_baseline && (
                            <span className="rounded bg-obsidian-850 border border-obsidian-border px-1 py-0.2 text-[9px] font-bold text-cyan-400">
                              BASELINE
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.input_cost_per_m}
                          onChange={(e) => setEditForm({ ...editForm, input_cost_per_m: parseFloat(e.target.value) })}
                          className="w-20 rounded border border-obsidian-border bg-obsidian-850 text-white p-1 text-right text-xs"
                        />
                      ) : (
                        `$${m.input_cost_per_m.toFixed(3)}`
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.output_cost_per_m}
                          onChange={(e) => setEditForm({ ...editForm, output_cost_per_m: parseFloat(e.target.value) })}
                          className="w-20 rounded border border-obsidian-border bg-obsidian-850 text-white p-1 text-right text-xs"
                        />
                      ) : (
                        `$${m.output_cost_per_m.toFixed(3)}`
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {(m.context_window / 1000).toFixed(0)}k
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-cyan-400">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.latency_estimate_ms}
                          onChange={(e) => setEditForm({ ...editForm, latency_estimate_ms: parseInt(e.target.value) })}
                          className="w-16 rounded border border-obsidian-border bg-obsidian-850 text-white p-1 text-right text-xs"
                        />
                      ) : (
                        `${m.latency_estimate_ms}ms`
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-medium">
                      <span className={m.quality_score >= 0.95 ? 'text-purple-400 font-bold' : 'text-slate-300'}>
                        {m.quality_score.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px]">
                        {m.supports_json && <span className="bg-obsidian-850 border border-obsidian-border text-slate-300 px-1.5 py-0.5 rounded font-mono">JSON</span>}
                        {m.supports_tools && <span className="bg-obsidian-850 border border-obsidian-border text-slate-300 px-1.5 py-0.5 rounded font-mono">Tools</span>}
                        {m.supports_vision && <span className="bg-obsidian-850 border border-obsidian-border text-slate-300 px-1.5 py-0.5 rounded font-mono">Vision</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                          className="w-12 rounded border border-obsidian-border bg-obsidian-850 text-white p-1 text-center text-xs"
                        />
                      ) : (
                        m.priority
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {m.is_enabled ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Disabled</Badge>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={saving}
                          className="rounded-lg bg-cyan-500 px-2.5 py-1 text-black font-bold text-[11px] shadow-sm hover:bg-cyan-400 transition"
                        >
                          <Save className="h-3 w-3 inline mr-1" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="rounded-lg border border-obsidian-border bg-obsidian-850 px-2 py-1 text-slate-400 hover:text-white transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
