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
  HelpCircle
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
      await loadRules(); // refresh pass/fail counts
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quality Evaluations & Structural Auditing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated schema enforcement, JSON completeness checks, refusal detection, and bounded fallback escalation
          </p>
        </div>

        <button
          onClick={loadRules}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
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
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Quality Validation Test Bench</h3>
          </div>
          <span className="text-xs text-slate-500">Test completions against all active criteria</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          <div>
            <textarea
              rows={5}
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Paste model output (JSON or text) here..."
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800 focus:outline-brand-500"
            />
            <button
              onClick={handleRunLiveTest}
              disabled={testLoading || !testContent.trim()}
              className="mt-2 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-50 transition"
            >
              <Play className="h-3.5 w-3.5" />
              {testLoading ? 'Evaluating against rules...' : 'Run Audit On Content'}
            </button>
          </div>

          <div className="bg-white rounded-lg p-3.5 border border-indigo-100 flex flex-col justify-between">
            {testResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-xs text-slate-800">
                    Audit Status: {testResult.passed ? (
                      <span className="text-emerald-700 font-bold ml-1">PASSED ALL CHECKS</span>
                    ) : (
                      <span className="text-rose-700 font-bold ml-1">QUALITY CHECKS FAILED</span>
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
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800">{r.rule_name}: </span>
                        <span className="text-slate-600">{r.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 text-center py-6">
                Click "Run Audit On Content" to evaluate the completion payload above against JSON schema, required keys, length bounds, and refusal checks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Configuration Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Configured Quality Guardrails</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{rule.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{rule.rule_type}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs">{rule.description}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    {rule.pass_rate_pct}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {rule.pass_count} / <span className="text-rose-600">{rule.fail_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`text-sm transition ${rule.is_active ? 'text-brand-600' : 'text-slate-300'}`}
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
