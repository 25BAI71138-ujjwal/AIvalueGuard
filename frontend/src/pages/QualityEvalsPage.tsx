import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Plus,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers,
  HelpCircle,
  Flame,
  Lock
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import { EvaluationRule } from '../types';

export const QualityEvalsPage: React.FC = () => {
  const [rules, setRules] = useState<EvaluationRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Live validator test state
  const [testContent, setTestContent] = useState('{\n  "status": "success",\n  "summary": "Customer billing cycle resolved",\n  "confidence": 0.98\n}');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getEvaluationRules();
      setRules(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = async (rule: EvaluationRule) => {
    try {
      const updated = await api.updateEvaluationRule(rule.id, { is_active: !rule.is_active });
      setRules(rules.map(r => r.id === rule.id ? updated : r));
    } catch (e) {
      alert("Failed to toggle rule");
    }
  };

  const handleRunLiveTest = async () => {
    if (!testContent.trim()) return;
    try {
      setTestLoading(true);
      const res = await api.runEvaluationTest(testContent);
      setTestResult(res);
      await loadRules();
    } catch (e) {
      alert("Evaluation failed");
    } finally {
      setTestLoading(false);
    }
  };

  const totalChecks = rules.reduce((acc, r) => acc + r.pass_count + r.fail_count, 0);
  const totalPasses = rules.reduce((acc, r) => acc + r.pass_count, 0);
  const overallPassRate = totalChecks > 0 ? ((totalPasses / totalChecks) * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading tracking-wide uppercase font-bold text-white flex items-center gap-2">
            Quality Evaluations & Structural Guardrails
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated schema enforcement, JSON completeness checks, refusal detection, and bounded fallback escalation
          </p>
        </div>

        <button
          onClick={loadRules}
          className="flex items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian-card px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white transition shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Audits
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Overall Pass Rate"
          value={`${overallPassRate}%`}
          subtext={`${totalPasses} checks passed across production traffic`}
          trend={{ value: "Strict Validation", positive: true }}
          icon={CheckCircle2}
        />

        <StatCard
          label="Active Guardrails"
          value={rules.filter(r => r.is_active).length}
          subtext={`${rules.length} total rules configured in policy`}
          icon={ShieldCheck}
        />

        <StatCard
          label="Recovery Policy"
          value="Bounded Escalation"
          subtext="Max 2 retries before escalating to stronger model"
          trend={{ value: "Zero infinite loops", neutral: true }}
          icon={Layers}
        />
      </div>

      {/* Live Quality Evaluator Tester */}
      <div className="rounded-xl border border-purple-500/30 bg-obsidian-card p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono">Live Guardrail Validation Test Bench</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Test completions against active criteria</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          <div>
            <textarea
              rows={5}
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Paste model output (JSON or text) here..."
              className="w-full rounded-xl border border-obsidian-border bg-obsidian-850 p-3 text-xs font-mono text-slate-200 focus:border-purple-500 outline-none leading-relaxed"
            />
            <button
              onClick={handleRunLiveTest}
              disabled={testLoading || !testContent.trim()}
              className="mt-2 flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 disabled:opacity-50 transition"
            >
              <Play className="h-3.5 w-3.5" />
              {testLoading ? 'Evaluating against rules...' : 'Run Audit On Content'}
            </button>
          </div>

          <div className="bg-obsidian-850 rounded-xl p-4 border border-obsidian-border flex flex-col justify-between">
            {testResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
                  <span className="font-semibold text-white">
                    Audit Status: {testResult.passed ? (
                      <span className="text-emerald-400 font-bold ml-1">PASSED ALL CHECKS</span>
                    ) : (
                      <span className="text-rose-400 font-bold ml-1">QUALITY CHECKS FAILED</span>
                    )}
                  </span>
                  <Badge variant={testResult.passed ? 'success' : 'error'}>
                    {testResult.passed_checks}/{testResult.total_checks} PASSED
                  </Badge>
                </div>

                <div className="space-y-2">
                  {testResult.results.map((r: any) => (
                    <div key={r.rule_id} className="text-xs flex items-start gap-2">
                      {r.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-white">{r.rule_name}: </span>
                        <span className="text-slate-400">{r.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 text-center py-6 font-mono">
                Click "Run Audit On Content" to evaluate the completion payload above against JSON schema, required keys, length bounds, and refusal checks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Configuration Table */}
      <div className="rounded-xl border border-obsidian-border bg-obsidian-card shadow-lg shadow-black/20 overflow-hidden">
        <div className="border-b border-obsidian-border p-4 bg-obsidian-850/50">
          <h3 className="text-sm font-semibold text-white">Configured Quality Guardrails</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-obsidian-850/80 border-b border-obsidian-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Guardrail Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Severity / Policy</th>
                <th className="py-3 px-4 text-right">Pass Rate</th>
                <th className="py-3 px-4 text-right">Pass / Fail</th>
                <th className="py-3 px-4 text-center">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/50">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 font-semibold text-white">{rule.name}</td>
                  <td className="py-3 px-4 font-mono text-purple-400">{rule.rule_type}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs">{rule.description}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="rounded bg-obsidian-850 border border-obsidian-border px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                    {rule.pass_rate_pct}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {rule.pass_count} / <span className="text-rose-400">{rule.fail_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`text-sm transition ${rule.is_active ? 'text-cyan-400' : 'text-slate-600'}`}
                      title={rule.is_active ? "Rule active" : "Rule disabled"}
                    >
                      {rule.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
