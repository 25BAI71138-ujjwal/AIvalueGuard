import React, { useState } from 'react';
import { ShieldAlert, Zap, Scissors, RefreshCw, AlertTriangle, CheckCircle, Terminal, Play } from 'lucide-react';

export interface AgentRunawayData {
  toolTokensPruned: number;         // e.g. 184,200 tokens
  infiniteLoopsBlocked: number;      // e.g. 12 loops intercepted
  estimatedDollarsSaved: number;     // e.g. $46.80
  avgPruneCompressionPct: number;    // e.g. 68.4%
  recentTrippedTools?: Array<{
    toolName: string;
    similarity: number;
    timestamp: string;
    action: string;
  }>;
}

interface AgentRunawayWidgetProps {
  data?: Partial<AgentRunawayData>;
  className?: string;
}

export const AgentRunawayWidget: React.FC<AgentRunawayWidgetProps> = ({
  data,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'intercepts'>('metrics');

  const metrics: AgentRunawayData = {
    toolTokensPruned: data?.toolTokensPruned ?? 184200,
    infiniteLoopsBlocked: data?.infiniteLoopsBlocked ?? 14,
    estimatedDollarsSaved: data?.estimatedDollarsSaved ?? 48.60,
    avgPruneCompressionPct: data?.avgPruneCompressionPct ?? 68.4,
    recentTrippedTools: data?.recentTrippedTools ?? [
      {
        toolName: 'query_customer_db',
        similarity: 0.98,
        timestamp: '14 min ago',
        action: 'Circuit Breaker Tripped: Repetitive SELECT * loop halted'
      },
      {
        toolName: 'web_search_google',
        similarity: 0.94,
        timestamp: '1 hr ago',
        action: 'Circuit Breaker Tripped: Near-identical search retry broken'
      },
      {
        toolName: 'fetch_billing_records',
        similarity: 0.91,
        timestamp: '3 hrs ago',
        action: 'Circuit Breaker Tripped: Alternating ping-pong query caught'
      }
    ]
  };

  return (
    <div className={`rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 hover:border-obsidian-border-hover transition-all ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Agent Runaway Interceptor & Tool Pruner
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                Armed (Sliding Window N=3)
              </span>
            </h3>
            <p className="text-xs text-slate-400">Payload schema projection &amp; &gt;90% similarity infinite loop breaker</p>
          </div>
        </div>

        <div className="flex gap-1 bg-obsidian-850 p-0.5 rounded-lg border border-obsidian-border">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
              activeTab === 'metrics'
                ? 'bg-portkey-500 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('intercepts')}
            className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
              activeTab === 'intercepts'
                ? 'bg-portkey-500 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked Loops ({metrics.infiniteLoopsBlocked})
          </button>
        </div>
      </div>

      {activeTab === 'metrics' ? (
        /* Metrics Grid */
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          {/* Tool Tokens Pruned */}
          <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Tokens Pruned</span>
              <Scissors className="h-3.5 w-3.5 text-portkey-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-portkey-400">
                {(metrics.toolTokensPruned / 1000).toFixed(1)}k
              </span>
              <span className="text-xs text-slate-400 font-mono">tokens</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              -{metrics.avgPruneCompressionPct}% avg payload size
            </p>
          </div>

          {/* Loops Blocked */}
          <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Loops Blocked</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-rose-400">
                {metrics.infiniteLoopsBlocked}
              </span>
              <span className="text-xs text-slate-400 font-mono">interrupted</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">Thrashing &gt;90% similarity</p>
          </div>

          {/* Dollars Saved */}
          <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Runaway Cost Avoided</span>
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ${metrics.estimatedDollarsSaved.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                Direct FinOps
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">Prevented runaway burns</p>
          </div>

          {/* Key Projection Rule Status */}
          <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase tracking-wider">Projection Engine</span>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-bold font-mono text-white">Schema Filtering</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Nulls stripped • Headers dropped • Arrays limited to top 5
            </p>
          </div>
        </div>
      ) : (
        /* Blocked Loops Log List */
        <div className="mt-4 space-y-2">
          {metrics.recentTrippedTools?.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian-850 border border-obsidian-border text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                  TRIPPED
                </span>
                <span className="text-white font-semibold">{item.toolName}</span>
                <span className="text-slate-400 text-[11px]">({(item.similarity * 100).toFixed(0)}% match)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] hidden md:inline">{item.action}</span>
                <span className="text-slate-500 text-[10px]">{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
