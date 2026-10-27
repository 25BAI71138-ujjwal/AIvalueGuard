import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Terminal,
  FileText
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { api } from '../api/client';
import { RequestItem, RequestDetail } from '../types';

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cachedFilter, setCachedFilter] = useState<boolean | undefined>(undefined);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getRequests({
        search: search || undefined,
        status: statusFilter || undefined,
        is_cached: cachedFilter,
        limit: 50
      });
      setRequests(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, cachedFilter]);

  const handleOpenDetail = async (id: string) => {
    setSelectedRequestId(id);
    try {
      setDetailLoading(true);
      const d = await api.getRequestDetail(id);
      setDetail(d);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gateway Requests Explorer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, routing traces, token consumption, and quality verdicts for all inference requests
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
            placeholder="Search by prompt keywords, model, or request ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:bg-white focus:outline-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="cached">Cached</option>
            <option value="fallback_success">Fallback</option>
            <option value="quality_failed">Quality Failed</option>
            <option value="error">Error</option>
          </select>

          <select
            value={cachedFilter === undefined ? '' : String(cachedFilter)}
            onChange={(e) => setCachedFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-brand-500"
          >
            <option value="">All Cache States</option>
            <option value="true">Cached Only</option>
            <option value="false">Fresh Calls Only</option>
          </select>
        </div>
      </div>

      {/* Request Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Prompt Preview</th>
                <th className="py-3 px-4">Model & Provider</th>
                <th className="py-3 px-4 text-right">Tokens</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Latency</th>
                <th className="py-3 px-4 text-center">Cache</th>
                <th className="py-3 px-4 text-center">Quality</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.id}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={r.prompt_preview}>
                      {r.prompt_preview}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-slate-900">{r.model_selected}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{r.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {r.total_tokens} <span className="text-[10px] text-slate-400">({r.prompt_tokens}/{r.completion_tokens})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-900">${r.actual_cost_usd.toFixed(5)}</div>
                      {r.savings_percentage > 0 && (
                        <div className="text-[10px] text-emerald-600 font-sans">
                          {r.savings_percentage}% saved
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">{r.latency_ms}ms</td>
                    <td className="py-3 px-4 text-center">
                      {r.is_cached ? (
                        <Badge variant="cached">Cached</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.quality_passed ? (
                        <span className="inline-flex items-center text-emerald-600" title="All quality checks passed">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-500" title="Quality check failure">
                          <XCircle className="h-4 w-4" />
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(r.id)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="h-3 w-3" /> Trace
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No requests found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trace Detail Modal */}
      <Modal
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        title={`Execution Trace: ${selectedRequestId}`}
        subtitle="End-to-end request lifecycle: cache evaluation, context compression, model routing, and quality audits."
        maxWidth="3xl"
      >
        {detailLoading || !detail ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* High-level status bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Final Status</span>
                <Badge variant={detail.status === 'success' || detail.status === 'cached' ? 'success' : 'warning'}>
                  {detail.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Model Selected</span>
                <span className="font-bold text-slate-900">{detail.model_selected}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Net Spend</span>
                <span className="font-bold text-emerald-700">${detail.financials.actual_cost_usd.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Latency</span>
                <span className="font-bold text-slate-900">{detail.performance.latency_ms}ms</span>
              </div>
            </div>

            {/* Prompt Preview */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-500" /> Inbound Prompt
              </h4>
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-slate-800 border border-slate-200">
                {detail.prompt_preview}
              </div>
            </div>

            {/* Context & Token Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" /> Token & Context Metrics
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prompt Tokens:</span>
                    <span>{detail.tokens.prompt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completion Tokens:</span>
                    <span>{detail.tokens.completion}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-slate-100 pt-1">
                    <span className="text-slate-700">Total Tokens:</span>
                    <span>{detail.tokens.total}</span>
                  </div>
                  {detail.tokens.saved_context > 0 && (
                    <div className="flex justify-between text-emerald-600 font-sans">
                      <span>Context Tokens Trimmed:</span>
                      <span>+{detail.tokens.saved_context}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial comparison */}
              <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Financial Telemetry
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Baseline Cost ({detail.baseline_model}):</span>
                    <span>${detail.financials.baseline_cost_usd.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Net Optimized Cost:</span>
                    <span>${detail.financials.actual_cost_usd.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 border-t border-slate-100 pt-1">
                    <span>Savings Amount:</span>
                    <span>${detail.financials.saved_cost_usd.toFixed(5)} ({detail.financials.savings_percentage}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Internal Gateway Overhead:</span>
                    <span>${detail.financials.optimization_overhead_usd.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Routing Decision Rationale */}
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
              <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-brand-600" /> Router Decision Rationale
              </h4>
              <p className="text-slate-700 leading-relaxed">{detail.routing.reason || "Direct routing"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
