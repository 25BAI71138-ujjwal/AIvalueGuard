import React, { useState } from 'react';
import { Layers, ShieldCheck, Zap, ArrowDownRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export interface KVCacheTopologyData {
  cacheAlignmentScore: number;       // 0 - 100%
  prefixTokensSecured: number;       // tokens locked in contiguous invariant prefix
  volatileItemsHoisted: number;      // timestamps, session IDs, etc. relocated
  estimatedSavingsUsd: number;       // total $ saved from prefix caching
  estimatedDiscountPct: number;      // 50% - 90%
  providerTier: 'OpenAI (50%)' | 'Anthropic (90%)' | 'DeepSeek (90%)' | 'Standard';
  sampleOriginal?: string;
  sampleOptimizedPrefix?: string;
  sampleTailEnvelope?: string;
}

interface KVCacheTopologyWidgetProps {
  data?: Partial<KVCacheTopologyData>;
  className?: string;
}

export const KVCacheTopologyWidget: React.FC<KVCacheTopologyWidgetProps> = ({
  data,
  className = ''
}) => {
  const [showTopologyDiff, setShowTopologyDiff] = useState(false);

  // Default demonstration metrics if none passed
  const metrics: KVCacheTopologyData = {
    cacheAlignmentScore: data?.cacheAlignmentScore ?? 94.2,
    prefixTokensSecured: data?.prefixTokensSecured ?? 1420,
    volatileItemsHoisted: data?.volatileItemsHoisted ?? 3,
    estimatedSavingsUsd: data?.estimatedSavingsUsd ?? 418.50,
    estimatedDiscountPct: data?.estimatedDiscountPct ?? 75.0,
    providerTier: data?.providerTier ?? 'DeepSeek (90%)',
    sampleOriginal: data?.sampleOriginal ?? `[Role: System]\nYou are a FinOps agent.\nTimestamp: 2026-10-27 21:38\nUser_id: usr_89234\nAlways output JSON schema.`,
    sampleOptimizedPrefix: data?.sampleOptimizedPrefix ?? `[Prefix: Invariant (Cached 90%)]\nYou are a FinOps agent.\nAlways output JSON schema.`,
    sampleTailEnvelope: data?.sampleTailEnvelope ?? `[Tail Envelope: Volatile (User Turn)]\n• Timestamp: 2026-10-27 21:38\n• User_id: usr_89234`
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className={`rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 hover:border-obsidian-border-hover transition-all ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-obsidian-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-portkey-500/10 border border-portkey-500/20 text-portkey-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              KV-Cache Topology Aligner
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Hoisting
              </span>
            </h3>
            <p className="text-xs text-slate-400">Deterministic prefix isolation for 50%–90% prompt cache discounts</p>
          </div>
        </div>

        <button
          onClick={() => setShowTopologyDiff(!showTopologyDiff)}
          className="text-xs font-mono text-portkey-400 hover:text-portkey-300 flex items-center gap-1.5 transition-colors px-2 py-1 rounded bg-obsidian-850 border border-obsidian-border"
        >
          {showTopologyDiff ? 'Hide Topology Map' : 'View Topology Map'}
          <ArrowDownRight className={`h-3 w-3 transition-transform ${showTopologyDiff ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
        {/* Alignment Score */}
        <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Cache Alignment</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{metrics.cacheAlignmentScore}%</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getScoreColor(metrics.cacheAlignmentScore)}`}>
              {metrics.cacheAlignmentScore >= 90 ? 'Optimal' : 'Sub-optimal'}
            </span>
          </div>
          <div className="mt-1.5 w-full bg-obsidian-card rounded-full h-1.5 overflow-hidden border border-obsidian-border">
            <div
              className="bg-gradient-to-r from-portkey-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.cacheAlignmentScore)}%` }}
            />
          </div>
        </div>

        {/* Prefix Tokens Secured */}
        <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Prefix Locked</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {metrics.prefixTokensSecured.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">tokens</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Continuous invariant prefix</p>
        </div>

        {/* Volatile Hoisted */}
        <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Volatile Variables</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {metrics.volatileItemsHoisted}
            </span>
            <span className="text-xs text-slate-400 font-mono">quarantined</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Dates/IDs moved to tail</p>
        </div>

        {/* Calculated Savings */}
        <div className="rounded-lg bg-obsidian-850 border border-obsidian-border p-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">KV-Cache Savings</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ${metrics.estimatedSavingsUsd.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
              -{metrics.estimatedDiscountPct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Discount on cached tokens</p>
        </div>
      </div>

      {/* Expandable Topology Diff Viewer */}
      {showTopologyDiff && (
        <div className="mt-4 pt-4 border-t border-obsidian-border/80">
          <div className="text-xs font-semibold text-slate-300 font-mono mb-2 flex items-center justify-between">
            <span>Deterministic Prefix Hoisting Architecture</span>
            <span className="text-[11px] text-slate-400">Token index 0 hashing preserved</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Before (Unoptimized) */}
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-slate-300">
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Raw Payload (Cache Breaker)
              </div>
              <pre className="text-[11px] text-rose-200/80 whitespace-pre-wrap leading-relaxed">
                {metrics.sampleOriginal}
              </pre>
              <div className="mt-2 text-[10px] text-rose-400/80 italic">
                ⚠️ Timestamp & User_ID at lines 3-4 break KV-cache hash for 100% of downstream tokens.
              </div>
            </div>

            {/* After (Topology Aligned) */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aligned Topology (Prefix Hoisted)
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                    Contiguous Invariant Prefix (Locked at Index 0)
                  </div>
                  <pre className="text-[11px] text-emerald-200/90 whitespace-pre-wrap">
                    {metrics.sampleOptimizedPrefix}
                  </pre>
                </div>
                <div className="p-2 rounded bg-obsidian-850 border border-obsidian-border">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
                    Volatile Runtime Envelope (Appended at Tail)
                  </div>
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
                    {metrics.sampleTailEnvelope}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
