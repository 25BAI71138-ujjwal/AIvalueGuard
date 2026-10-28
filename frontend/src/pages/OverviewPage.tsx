import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  Zap,
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Layers,
  Flame
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { KVCacheTopologyWidget } from '../components/KVCacheTopologyWidget';
import { AgentRunawayWidget } from '../components/AgentRunawayWidget';
import { api } from '../api/client';
import { OverviewData } from '../types';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOverview('ws_default', timeRange);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overview metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="text-xs font-mono">Aggregating Portkey Gateway telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-rose-400 mb-2" />
        <h3 className="text-sm font-semibold text-rose-300">Unable to load metrics</h3>
        <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-lg bg-obsidian-card px-3 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/30 shadow-sm hover:bg-rose-950/30 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading tracking-wide uppercase font-bold text-white flex items-center gap-2">
            Gateway Telemetry & Performance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inference financial telemetry, routing efficiency, and quality validation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-obsidian-border bg-obsidian-card p-1 text-xs shadow-inner">
            {['24h', '7d', '30d', '90d'].map((range) => (
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
            className="rounded-lg border border-obsidian-border bg-obsidian-card p-2 text-slate-400 hover:text-white transition"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Net Spend"
          value={`$${(m?.total_spend_usd ?? 0).toFixed(4)}`}
          subtext={`vs $${(m?.baseline_spend_usd ?? 0).toFixed(4)} baseline`}
          trend={{ value: `${m?.savings_percentage ?? 0}% Saved`, positive: true }}
          icon={DollarSign}
        />

        <StatCard
          label="Verified Savings"
          value={`$${(m?.total_savings_usd ?? 0).toFixed(4)}`}
          subtext={`Overhead: $${(m?.optimization_overhead_usd ?? 0).toFixed(4)}`}
          badge={m?.is_demo ? "Demo Dataset" : "Live API"}
          trend={{ value: "Quality Preserved", positive: true }}
          icon={TrendingDown}
        />

        <StatCard
          label="p95 Latency"
          value={`${m?.latency.p95 ?? 0}ms`}
          subtext={`Avg: ${m?.latency.avg ?? 0}ms | p50: ${m?.latency.p50 ?? 0}ms`}
          trend={{ value: "Within SLA", positive: true }}
          icon={Clock}
        />

        <StatCard
          label="Quality Pass Rate"
          value={`${m?.quality_pass_rate_pct ?? 100}%`}
          subtext={`Cache-hit: ${m?.cache_hit_rate_pct ?? 0}% | Fallback: ${m?.fallback_rate_pct ?? 0}%`}
          trend={{ value: `${m?.successful_requests ?? 0}/${m?.total_requests ?? 0} Succeeded`, positive: true }}
          icon={CheckCircle2}
        />
      </div>

      {/* AI FinOps Infrastructure Modules (PS-08) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KVCacheTopologyWidget />
        <AgentRunawayWidget />
      </div>

      {/* Spend Over Time Chart */}
      <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Spending Over Time</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily comparison between unoptimized baseline model cost and Portkey Gateway optimized execution
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-500" /> Baseline Spend
            </span>
            <span className="flex items-center gap-1.5 font-medium text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Optimized Spend
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {data?.spend_chart && data.spend_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.spend_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="optColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="baseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(5)}`, '']}
                  labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '12px', color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="baseline_spend" name="Baseline Spend" stroke="#64748b" strokeWidth={1.5} fillOpacity={1} fill="url(#baseColor)" />
                <Area type="monotone" dataKey="optimized_spend" name="Optimized Spend" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#optColor)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400 font-mono">
              No historical requests in this time range.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Model Breakdown & Recent Optimization Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Breakdown */}
        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Inference Distribution</h3>
              <p className="text-xs text-slate-400">Breakdown of models selected by the router</p>
            </div>
            <Link to="/models" className="text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Configure <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-obsidian-border text-slate-400">
                  <th className="pb-2">Model</th>
                  <th className="pb-2">Provider</th>
                  <th className="pb-2 text-right">Volume</th>
                  <th className="pb-2 text-right">Avg Latency</th>
                  <th className="pb-2 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border/50">
                {data?.model_breakdown.map((mb) => (
                  <tr key={mb.model} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 font-medium text-white">{mb.model}</td>
                    <td className="py-2.5 text-slate-400 capitalize">{mb.provider}</td>
                    <td className="py-2.5 text-right font-medium text-slate-300">
                      {mb.request_count} <span className="text-slate-500 text-[10px]">({mb.percentage}%)</span>
                    </td>
                    <td className="py-2.5 text-right text-cyan-400">{mb.avg_latency_ms}ms</td>
                    <td className="py-2.5 text-right font-medium text-white">${mb.total_cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Optimization Savings Events */}
        <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Gateway Routing Events</h3>
              <p className="text-xs text-slate-400">Live router decisions, fallbacks, and cache hits</p>
            </div>
            <Link to="/requests" className="text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {data?.recent_savings_events.map((ev) => (
              <div
                key={ev.request_id}
                className="rounded-lg border border-obsidian-border bg-obsidian-850 p-3 text-xs flex items-center justify-between hover:border-obsidian-border-hover transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-white">{ev.model_selected}</span>
                    <Badge variant={ev.status === 'cached' ? 'cached' : 'success'}>
                      {ev.status === 'cached' ? 'CACHED' : `${ev.savings_pct}% SAVED`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs">{ev.reason}</p>
                </div>

                <div className="text-right font-mono">
                  <span className="font-semibold text-emerald-400">+${ev.saved_usd.toFixed(5)}</span>
                  <div className="text-[10px] text-slate-500">{ev.timestamp.split(' ')[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
