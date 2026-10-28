import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  TrendingDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock,
  Zap,
  Flame
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { CacheStats, CacheEntryItem } from '../types';

export const CachePage: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [entries, setEntries] = useState<CacheEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCacheData = async () => {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([
        api.getCacheStats('ws_default'),
        api.getCacheEntries('ws_default')
      ]);
      setStats(s);
      setEntries(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheData();
  }, []);

  const handleInvalidateAll = async () => {
    if (!window.confirm("Are you sure you want to invalidate all active cache entries in this workspace?")) return;
    try {
      setInvalidating(true);
      const res = await api.invalidateCache({ workspace_id: 'ws_default' });
      setToastMessage(res.message);
      await loadCacheData();
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      alert("Failed to invalidate cache");
    } finally {
      setInvalidating(false);
    }
  };

  const handleInvalidateKey = async (cacheKey: string) => {
    try {
      await api.invalidateCache({ cache_key: cacheKey });
      await loadCacheData();
    } catch (e) {
      alert("Failed to invalidate entry");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading tracking-wide uppercase font-bold text-white flex items-center gap-2">
            Safe Exact & Semantic Caching
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic SHA-256 request fingerprinting with strict tenant isolation, freshness TTL, and instant invalidation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCacheData}
            className="rounded-lg border border-obsidian-border bg-obsidian-card p-2 text-slate-400 hover:text-white transition shadow-sm"
            title="Refresh cache status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleInvalidateAll}
            disabled={invalidating}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3.5 py-1.5 text-xs font-mono font-semibold text-rose-300 hover:bg-rose-900/40 transition shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {invalidating ? 'Invalidating...' : 'Invalidate Workspace Cache'}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-center gap-2 font-mono">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cache Hit Rate"
          value={`${stats?.hit_rate_percentage ?? 0}%`}
          subtext={`${stats?.total_hits ?? 0} hits / ${stats?.total_misses ?? 0} misses`}
          trend={{ value: "100% Quality Preserved", positive: true }}
          icon={Zap}
        />

        <StatCard
          label="Direct Cost Avoided"
          value={`$${(stats?.total_cost_saved_usd ?? 0).toFixed(4)}`}
          subtext={`${stats?.total_tokens_saved?.toLocaleString() ?? 0} tokens saved`}
          trend={{ value: "Near Zero Latency", positive: true }}
          icon={TrendingDown}
        />

        <StatCard
          label="Active Entries"
          value={stats?.active_entries ?? 0}
          subtext={`Total created: ${stats?.total_entries ?? 0}`}
          icon={Database}
        />

        <StatCard
          label="Cache Architecture"
          value={stats?.cache_memory_mode ?? "In-Memory LRU"}
          subtext={`Freshness TTL: ${(stats?.ttl_seconds ?? 86400) / 3600} hours`}
          icon={Clock}
        />
      </div>

      {/* Safe Caching Rules Info Note */}
      <div className="rounded-xl border border-obsidian-border bg-obsidian-card p-4 text-xs space-y-2 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 text-white font-semibold font-mono">
          <Info className="h-4 w-4 text-cyan-400" />
          <span>Safety & Cryptographic Tenant Isolation</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-sans">
          Portkey request fingerprints cryptographically incorporate the <strong>Workspace ID, Model ID, System Instructions, Context Body, Prompt, and Temperature</strong>.
          Responses with failed quality evaluations, provider errors, or <code className="bg-obsidian-850 px-1.5 py-0.5 rounded text-[11px] font-mono text-cyan-400 border border-obsidian-border">allow_cache: false</code> are strictly prevented from entering the cache store.
        </p>
      </div>

      {/* Active Cache Entries Table */}
      <div className="rounded-xl border border-obsidian-border bg-obsidian-card shadow-lg shadow-black/20 overflow-hidden">
        <div className="border-b border-obsidian-border p-4 flex items-center justify-between bg-obsidian-850/50">
          <h3 className="text-sm font-semibold text-white">Stored Cache Records</h3>
          <span className="text-xs text-slate-400 font-mono">{entries.length} active fingerprints</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-obsidian-850/80 border-b border-obsidian-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Cache Fingerprint</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Prompt Preview</th>
                <th className="py-3 px-4 text-right">Hits</th>
                <th className="py-3 px-4 text-right">Tokens Saved</th>
                <th className="py-3 px-4 text-right">Cost Avoided</th>
                <th className="py-3 px-4 text-right">Expires In</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/50">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.cache_key} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                      {entry.cache_key.substring(0, 14)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-white">{entry.model}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={entry.prompt_preview}>
                      {entry.prompt_preview}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-400">
                      {entry.hit_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {(entry.prompt_tokens + entry.completion_tokens) * entry.hit_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ${(entry.cost_saved_per_hit * entry.hit_count).toFixed(5)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {new Date(entry.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInvalidateKey(entry.cache_key)}
                        className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Evict entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No active cache entries found. Execute queries through the Gateway or Playground to populate cache.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
