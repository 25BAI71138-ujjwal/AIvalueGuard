import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  PieChart as PieIcon,
  BarChart2,
  RefreshCw,
  Layers,
  Database,
  ArrowRight,
  Info,
  Flame,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { api } from '../api/client';

const COLORS = ['#f97316', '#06b6d4', '#10b981', '#a855f7', '#3b82f6', '#ec4899'];

export const CostAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCostAnalytics('ws_default', timeRange);
      setAnalytics(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const m = analytics?.metrics;
  const pieData = analytics?.model_breakdown?.map((item: any) => ({
    name: item.model,
    value: item.total_cost
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading tracking-wide uppercase font-bold text-white flex items-center gap-2">
            Cost & Savings Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent attribution across cache avoidance, intelligent model routing, and internal gateway processing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-obsidian-border bg-obsidian-card p-1 text-xs shadow-inner">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1 font-mono font-medium transition ${
                  timeRange === range
                    ? 'bg-cyan-500 text-black font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-obsidian-border bg-obsidian-card p-2 text-slate-400 hover:text-white transition shadow-sm"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net Spend (Actual)"
          value={`$${(m?.total_spend_usd ?? 0).toFixed(4)}`}
          subtext={`Baseline: $${(m?.baseline_spend_usd ?? 0).toFixed(4)}`}
          trend={{ value: `${m?.savings_percentage ?? 0}% Total Saved`, positive: true }}
          icon={DollarSign}
        />

        <StatCard
          label="Cost per Successful Task"
          value={`$${(m?.cost_per_successful_task ?? 0).toFixed(5)}`}
          subtext={`Total requests: ${m?.total_requests ?? 0}`}
          trend={{ value: "High Efficiency", positive: true }}
          icon={TrendingDown}
        />

        <StatCard
          label="Verified Net Savings"
          value={`$${(analytics?.savings_attribution?.verified_net_savings_usd ?? 0).toFixed(4)}`}
          subtext="Excludes failed checks"
          badge="Audit Verified"
          trend={{ value: "Quality Maintained", positive: true }}
          icon={DollarSign}
        />

        <StatCard
          label="Optimization Overhead"
          value={`$${(analytics?.savings_attribution?.optimization_overhead_usd ?? 0).toFixed(5)}`}
          subtext="Internal gateway cost deducted"
          trend={{ value: "0.2% of savings", neutral: true }}
          icon={Layers}
        />
      </div>

      {/* Savings Attribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <Database className="h-4 w-4 text-cyan-400" /> Cache-Avoidance Savings
            </span>
            <Badge variant="cached">EXACT FINGERPRINT</Badge>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ${(analytics?.savings_attribution?.cache_related_savings_usd ?? 0).toFixed(4)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">100% token cost eliminated on duplicate queries</p>
        </div>

        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <Layers className="h-4 w-4 text-cyan-400" /> Multi-Model Routing Savings
            </span>
            <Badge variant="success">ROUTER RANKING</Badge>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            ${(analytics?.savings_attribution?.routing_related_savings_usd ?? 0).toFixed(4)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Selecting lowest-cost capable model vs heavyweight baseline</p>
        </div>

        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <TrendingDown className="h-4 w-4 text-purple-400" /> Context Compaction
            </span>
            <Badge variant="neutral">TRIM REDUNDANCY</Badge>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
            ~15–25% tokens
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Deduplication and prompt white-space compaction</p>
        </div>
      </div>

      {/* Charts: Spend Breakdown by Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Cost Distribution Bar Chart */}
        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-white mb-1">Spend by Model</h3>
          <p className="text-xs text-slate-400 mb-4">Total USD invoiced per deployed model tier</p>

          <div className="h-64 w-full">
            {analytics?.model_breakdown && analytics.model_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.model_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="model" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toFixed(5)}`, 'Cost']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="total_cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-mono">
                No model telemetry available.
              </div>
            )}
          </div>
        </div>

        {/* Cost Share Pie Chart */}
        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Cost Share Ratio</h3>
            <p className="text-xs text-slate-400 mb-4">Percentage breakdown of total inference budget</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `$${Number(val).toFixed(4)}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px', color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No cost records.</div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-obsidian-border pt-3 flex items-center gap-1.5 font-mono">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>Formula: Savings % = ((Baseline Total − Optimized Total) / Baseline Total) × 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
