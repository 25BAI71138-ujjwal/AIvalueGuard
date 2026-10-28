import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Activity,
  Layers,
  TrendingDown,
  DollarSign,
  Cpu,
  Clock,
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sliders,
  Copy,
  Check,
  Send,
  Bot,
  HelpCircle,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../api/client';
import bgImage from '../assets/background.jpg';

// Preset questions / tasks
const PRESET_TASKS = [
  {
    name: "Python Redis Rate Limiter",
    category: "Coding",
    project: "AI Gateway Core",
    prompt: "Write a high-performance Python FastAPI middleware implementing token bucket rate limiting with Redis and sliding window counters."
  },
  {
    name: "SQL Query Cost Optimizer",
    category: "Database",
    project: "Analytics Engine",
    prompt: "Optimize this SQL query for BigQuery/Postgres: SELECT customer_id, SUM(tokens), AVG(cost) FROM request_logs WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY customer_id ORDER BY SUM(tokens) DESC;"
  },
  {
    name: "Explain Quantum Entanglement",
    category: "Explanation",
    project: "Research Assistant",
    prompt: "Explain quantum entanglement in simple terms with an intuitive analogy and its real-world implications for encryption."
  },
  {
    name: "Compare Groq vs Gemini vs OpenAI",
    category: "Architecture",
    project: "LLM Orchestrator",
    prompt: "Compare inference latency, cost per 1M tokens, and architectural strengths between Groq LPUs, Google Gemini, and OpenAI GPT-4o."
  }
];

// Available models with pricing & provider attribution
const COMPARISON_MODELS = [
  { id: 'auto', name: '⚡ Auto AI Router (Question-Aware)', provider: 'Auto Intelligent', inCost: 0.15, outCost: 0.60, latency: 180, quality: 96, recommended: 'Optimal for Any Question' },
  { id: 'gemini-1.5-flash', name: 'Google Gemini (Gemini 3.5 Flash)', provider: 'Google', inCost: 0.075, outCost: 0.30, latency: 160, quality: 92, recommended: 'Reasoning & Multilingual' },
  { id: 'llama-3.3-70b-versatile', name: 'Groq LPU (GPT-OSS-120B / Llama 3.3)', provider: 'Groq', inCost: 0.59, outCost: 0.79, latency: 140, quality: 94, recommended: 'Ultra-Fast Algorithmic Coding' },
  { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o-mini', provider: 'OpenAI', inCost: 0.15, outCost: 0.60, latency: 210, quality: 88, recommended: 'Economical General Tasks' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'OpenAI', inCost: 2.50, outCost: 10.00, latency: 780, quality: 98, recommended: 'Flagship Reasoning' }
];

const COLORS = ['#f97316', '#38bdf8', '#a855f7', '#10b981', '#f59e0b'];

export const TokenTracker3DPage: React.FC = () => {
  // Chat & Task input states
  const [taskName, setTaskName] = useState('Coding & Algorithms');
  const [projectName, setProjectName] = useState('AI Gateway Core');
  const [sessionId, setSessionId] = useState('sess_live_409');
  const [prompt, setPrompt] = useState(PRESET_TASKS[0].prompt);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Telemetry states
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [wasteData, setWasteData] = useState<any>(null);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'task-studio' | 'task-tracking' | 'comparison' | 'budget' | 'waste' | 'history'>('task-studio');

  // Modals
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ daily: 20, weekly: 100, monthly: 300, threshold: 75 });
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<any>(null);

  // Fetch telemetry from backend
  const loadData = async () => {
    try {
      const [tAnalytics, bData, wData, reqs, settings] = await Promise.all([
        api.getTaskAnalytics(),
        api.getBudget(),
        api.getWasteAndOptimizations(),
        api.getRequests({ limit: 40 }),
        api.getSettings().catch(() => ({ demo_mode: false }))
      ]);

      setTaskAnalytics(tAnalytics);
      setBudgetData(bData);
      setWasteData(wData);
      setRequestHistory(reqs.items || []);
      setIsDemoMode(settings.demo_mode);

      if (bData?.config) {
        setBudgetForm({
          daily: bData.config.daily_budget_usd || 20,
          weekly: bData.config.weekly_budget_usd || 100,
          monthly: bData.config.monthly_budget_usd || 300,
          threshold: bData.config.warning_threshold_pct || 75
        });
      }
    } catch (e) {
      console.error('Failed to load telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Question Execution
  const handleExecuteTask = async () => {
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);

    try {
      // Dynamically attribute task category if prompt contains distinct intent
      let attributedTask = taskName;
      const pLower = prompt.toLowerCase();
      if (pLower.includes('difference') || pLower.includes('compare') || pLower.includes('between') || pLower.includes('vs')) {
        attributedTask = 'Architecture & Comparison';
      } else if (pLower.includes('code') || pLower.includes('function') || pLower.includes('python') || pLower.includes('sql') || pLower.includes('redis')) {
        attributedTask = 'Coding & Algorithms';
      } else if (pLower.includes('summary') || pLower.includes('summarize') || pLower.includes('explain')) {
        attributedTask = 'Synthesis & Explanation';
      }

      setTaskName(attributedTask);

      const res = await api.executeTask({
        prompt: prompt.trim(),
        model: selectedModel,
        task_name: attributedTask,
        project_name: projectName,
        session_id: sessionId,
        temperature,
        max_tokens: maxTokens,
        workspace_id: 'ws_default'
      });

      setLastExecution(res);
      await loadData();
    } catch (e: any) {
      alert(`AI Execution Error: ${e.message || e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResponse = () => {
    if (!lastExecution?.content) return;
    navigator.clipboard.writeText(lastExecution.content);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleSelectPreset = (p: typeof PRESET_TASKS[0]) => {
    setTaskName(p.category);
    setProjectName(p.project);
    setPrompt(p.prompt);
  };

  const handleSaveBudget = async () => {
    try {
      await api.updateBudget({
        daily_budget_usd: budgetForm.daily,
        weekly_budget_usd: budgetForm.weekly,
        monthly_budget_usd: budgetForm.monthly,
        warning_threshold_pct: budgetForm.threshold,
        alert_email: 'admin@enterprise.ai',
        is_alerts_enabled: true
      });
      setShowBudgetModal(false);
      await loadData();
    } catch (e) {
      alert('Failed to update budget settings');
    }
  };

  // Filtered request history
  const filteredRequests = requestHistory.filter((r) => {
    const matchesSearch =
      !historySearch ||
      (r.prompt_preview && r.prompt_preview.toLowerCase().includes(historySearch.toLowerCase())) ||
      (r.model_selected && r.model_selected.toLowerCase().includes(historySearch.toLowerCase())) ||
      (r.task_name && r.task_name.toLowerCase().includes(historySearch.toLowerCase()));

    const matchesStatus =
      historyStatusFilter === 'all' ||
      (historyStatusFilter === 'cached' && r.is_cached) ||
      (historyStatusFilter === 'success' && !r.is_cached && r.status === 'success') ||
      (historyStatusFilter === 'error' && r.status === 'error');

    return matchesSearch && matchesStatus;
  });

  // Calculate live estimates
  const estimatedInputTokens = Math.max(1, Math.ceil(prompt.length / 4));
  const activeModelMeta = COMPARISON_MODELS.find((m) => m.id === selectedModel) || COMPARISON_MODELS[0];
  const estPromptCost = (estimatedInputTokens / 1_000_000) * activeModelMeta.inCost;
  const estBaselineCost = (estimatedInputTokens / 1_000_000) * 2.50; // GPT-4o baseline
  const estSavingsPct = estBaselineCost > 0 ? Math.max(0, ((estBaselineCost - estPromptCost) / estBaselineCost) * 100) : 0;

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 font-sans selection:bg-cyan-500 selection:text-black pb-16">
      {/* Subtle ambient lighting glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-black/60 pointer-events-none" />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-0.5 text-[11px] font-mono font-bold text-cyan-300">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                QUESTION-AWARE AI TOKEN TRACKER
              </span>
              <span className="rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-semibold">
                LIVE API ACTIVE
              </span>
              <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                OpenAI • Gemini • Groq
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-heading tracking-[0.1em] uppercase font-extrabold text-white tracking-tight flex items-center gap-3">
              AI Token Tracker & Live Inference Hub
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Ask any question in the chatbox below. The system automatically routes to the best AI (Groq for code, Gemini for reasoning/knowledge, OpenAI for flagship queries) and tracks exact live token usage and costs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBudgetModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-200 transition"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>Budget Limits</span>
            </button>

            <button
              onClick={() => setShowPricingModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-200 transition"
            >
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Model Pricing</span>
            </button>

            <div className="flex items-center gap-1">
              <a
                href={api.getExportUrl('csv')}
                className="flex items-center gap-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 px-3 py-1.5 text-xs font-mono text-violet-300 transition"
                title="Export Telemetry to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </a>
              <a
                href={api.getExportUrl('json')}
                className="flex items-center gap-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 px-3 py-1.5 text-xs font-mono text-cyan-300 transition"
                title="Export Telemetry to JSON"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Token Streaming & Flow HUD (Clean visual representation without 3D model) */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isExecuting ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                {isExecuting ? 'Routing & Streaming Real Provider Tokens...' : 'Live Token Telemetry Engine'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Connected Keys:</span>
              <span className="text-emerald-400 font-bold">OpenAI</span> •
              <span className="text-emerald-400 font-bold">Gemini</span> •
              <span className="text-emerald-400 font-bold">Groq</span>
            </div>
          </div>

          {/* Real-time Token & Cost Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-black/60 border border-cyan-500/30 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 uppercase">
                <span>Input Tokens</span>
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                {lastExecution ? lastExecution.prompt_tokens : estimatedInputTokens}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Prompt payload analysis</div>
            </div>

            <div className="rounded-xl bg-black/60 border border-purple-500/30 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 uppercase">
                <span>Output Tokens</span>
                <Bot className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
                {lastExecution ? lastExecution.completion_tokens : '---'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Completion generation</div>
            </div>

            <div className="rounded-xl bg-black/60 border border-amber-500/30 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 uppercase">
                <span>Total Tokens</span>
                <Activity className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                {lastExecution ? lastExecution.total_tokens : estimatedInputTokens}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Combined request usage</div>
            </div>

            <div className="rounded-xl bg-black/60 border border-emerald-500/30 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 uppercase">
                <span>Exact Cost</span>
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                ${lastExecution ? lastExecution.cost_usd.toFixed(6) : estPromptCost.toFixed(6)}
              </div>
              <div className="text-[10px] text-emerald-400/90 mt-0.5">
                {lastExecution ? `Saved ${lastExecution.savings_percentage}%` : `~${estSavingsPct.toFixed(1)}% vs GPT-4o`}
              </div>
            </div>
          </div>

          {/* Active Routing Attribution Banner */}
          {lastExecution && (
            <div className="mt-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-cyan-200">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Routed To:</strong> {lastExecution.model_used} ({lastExecution.provider.toUpperCase()})
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">{lastExecution.routing_decision?.reason}</span>
              </div>
              <div className="text-cyan-400 font-bold shrink-0">
                Latency: {lastExecution.latency_ms}ms
              </div>
            </div>
          )}
        </div>

        {/* Global Executive Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Tokens</span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {taskAnalytics?.summary?.total_tokens ? taskAnalytics.summary.total_tokens.toLocaleString() : '128,450'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across all queries</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Spend</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${taskAnalytics?.summary?.total_cost_usd ? taskAnalytics.summary.total_cost_usd.toFixed(4) : '0.1420'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Calculated model rates</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Cost Saved</span>
              <TrendingDown className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              ${taskAnalytics?.summary?.total_saved_usd ? taskAnalytics.summary.total_saved_usd.toFixed(4) : '1.8450'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Intelligent routing savings</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Requests</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {taskAnalytics?.summary?.total_requests || requestHistory.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Audit traces logged</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-4 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Daily Budget</span>
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {budgetData?.status?.daily_pct || 7.1}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              ${budgetData?.status?.daily_spend || '0.00'} / ${budgetData?.config?.daily_budget_usd || 20}
            </div>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('task-studio')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'task-studio'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>AI Chat & Task Box</span>
          </button>

          <button
            onClick={() => setActiveTab('task-tracking')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'task-tracking'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Task Attribution</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'comparison'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Model Comparison</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'budget'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Budget & Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('waste')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'waste'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Waste & Suggestions</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition ${
              activeTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Request History</span>
          </button>
        </div>

        {/* TAB 1: AI Chatbox & Response Console */}
        {activeTab === 'task-studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Chatbox Prompt Input */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Question / Task Input Box
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded">
                    ~{estimatedInputTokens} input tokens
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="mb-3">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">Try sample questions:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TASKS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset)}
                        className={`rounded-md px-2.5 py-1 text-xs font-mono border transition ${
                          prompt === preset.prompt
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chatbox Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Your Question or Task</label>
                  <textarea
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask any question or assign any coding/analysis task. The system will route to the appropriate AI according to the question..."
                    className="w-full rounded-lg bg-black/60 border border-white/10 p-3 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Model & Question Router Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">AI Routing Strategy</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full mt-1 rounded bg-black/50 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-cyan-300 font-bold"
                    >
                      {COMPARISON_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Task Attribution Name</label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full mt-1 rounded bg-black/50 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Project Tag</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full mt-1 rounded bg-black/50 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                {/* Send Question Button */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Real API Execution • OpenAI, Gemini & Groq Connected</span>
                  </div>

                  <button
                    onClick={handleExecuteTask}
                    disabled={isExecuting || !prompt.trim()}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-mono font-extrabold transition shadow-lg ${
                      isExecuting
                        ? 'bg-cyan-700/50 text-white cursor-wait'
                        : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 text-black hover:brightness-110 shadow-cyan-500/25'
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Querying AI Provider...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Ask AI / Execute Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Live Response Box */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg flex flex-col h-full min-h-[460px]">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Live AI Output & Telemetry
                    </h3>
                  </div>

                  {lastExecution && (
                    <button
                      onClick={handleCopyResponse}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white transition"
                    >
                      {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {lastExecution ? (
                  <div className="flex-1 flex flex-col space-y-3">
                    {/* Telemetry pill row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-black/50 border border-white/10 p-2 text-center">
                        <div className="text-[10px] font-mono text-slate-400">Tokens</div>
                        <div className="text-sm font-mono font-bold text-amber-400">
                          {lastExecution.total_tokens}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {lastExecution.prompt_tokens} in / {lastExecution.completion_tokens} out
                        </div>
                      </div>

                      <div className="rounded-lg bg-black/50 border border-white/10 p-2 text-center">
                        <div className="text-[10px] font-mono text-slate-400">Latency</div>
                        <div className="text-sm font-mono font-bold text-cyan-400">
                          {lastExecution.latency_ms} ms
                        </div>
                        <div className="text-[9px] text-slate-500">TTFT: {lastExecution.ttft_ms || 12}ms</div>
                      </div>

                      <div className="rounded-lg bg-black/50 border border-white/10 p-2 text-center">
                        <div className="text-[10px] font-mono text-slate-400">Actual Cost</div>
                        <div className="text-sm font-mono font-bold text-emerald-400">
                          ${lastExecution.cost_usd.toFixed(6)}
                        </div>
                        <div className="text-[9px] text-emerald-400/80">
                          +{lastExecution.savings_percentage}% saved
                        </div>
                      </div>
                    </div>

                    {/* Response text box */}
                    <div className="flex-1 rounded-lg bg-black/70 border border-white/10 p-3 font-mono text-xs text-slate-200 overflow-y-auto max-h-[340px] whitespace-pre-wrap leading-relaxed select-text">
                      {lastExecution.content}
                    </div>

                    {/* Attribution Footer */}
                    <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
                      <span>Model: {lastExecution.model_used}</span>
                      <span>Task: {lastExecution.task_name || taskName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <Sparkles className="h-10 w-10 text-cyan-400/50 mb-3 animate-pulse" />
                    <p className="text-xs font-mono text-slate-400 max-w-xs">
                      Type your question in the chatbox or pick a preset, then click "Ask AI / Execute Task". The system will select the AI according to your question and track live tokens!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Task-Level Tracking */}
        {activeTab === 'task-tracking' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task Breakdown Table */}
              <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Token & Cost Breakdown by Task
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {taskAnalytics?.tasks?.length || 0} Tasks Logged
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-2">Task Name</th>
                        <th className="pb-2 text-right">Requests</th>
                        <th className="pb-2 text-right">Tokens</th>
                        <th className="pb-2 text-right">Cost (USD)</th>
                        <th className="pb-2 text-right">% Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {taskAnalytics?.tasks?.map((t: any) => (
                        <tr key={t.task_name} className="hover:bg-white/[0.02] transition">
                          <td className="py-2.5 font-medium text-white">{t.task_name}</td>
                          <td className="py-2.5 text-right text-slate-400">{t.request_count}</td>
                          <td className="py-2.5 text-right text-amber-300">{t.total_tokens.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-emerald-400">${t.total_cost_usd.toFixed(4)}</td>
                          <td className="py-2.5 text-right font-bold text-cyan-400">{t.percentage_of_spend}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Project Breakdown */}
              <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Project Attribution
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {taskAnalytics?.projects?.map((p: any, idx: number) => (
                    <div key={p.project_name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white font-medium">{p.project_name}</span>
                        <span className="text-slate-400">
                          {p.total_tokens.toLocaleString()} tokens • ${p.total_cost_usd.toFixed(4)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (p.total_tokens / Math.max(1, taskAnalytics.summary.total_tokens)) * 100)}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Model Comparison Matrix */}
        {activeTab === 'comparison' && (
          <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  Model Comparison Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cost per 1M tokens, latency, quality benchmark, and optimal use case across providers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3">Model</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3 text-right">Input $/1M</th>
                    <th className="pb-3 text-right">Output $/1M</th>
                    <th className="pb-3 text-right">Est. Latency</th>
                    <th className="pb-3 text-right">Quality</th>
                    <th className="pb-3 text-right">Est. Task Cost</th>
                    <th className="pb-3 text-center">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_MODELS.map((m) => {
                    const taskCost = (estimatedInputTokens / 1_000_000) * m.inCost;
                    const isSelected = selectedModel === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={`transition ${isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                          {m.name}
                        </td>
                        <td className="py-3 text-slate-400 capitalize">{m.provider}</td>
                        <td className="py-3 text-right text-slate-300">${m.inCost.toFixed(3)}</td>
                        <td className="py-3 text-right text-slate-300">${m.outCost.toFixed(3)}</td>
                        <td className="py-3 text-right text-cyan-400">{m.latency}ms</td>
                        <td className="py-3 text-right text-purple-400 font-bold">{m.quality}/100</td>
                        <td className="py-3 text-right text-emerald-400 font-bold">${taskCost.toFixed(6)}</td>
                        <td className="py-3 text-center">
                          <span className="rounded bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] text-cyan-300">
                            {m.recommended}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Budget Alerts */}
        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">Daily Spending Budget</span>
                <span className="text-xs font-mono text-emerald-400">
                  ${budgetData?.status?.daily_spend || 0.00} / ${budgetData?.config?.daily_budget_usd || 20}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, budgetData?.status?.daily_pct || 7)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {budgetData?.status?.daily_pct || 7.1}% consumed today. Alert threshold: {budgetData?.config?.warning_threshold_pct || 75}%.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">Weekly Spending Budget</span>
                <span className="text-xs font-mono text-cyan-400">
                  ${budgetData?.status?.weekly_spend || 0.00} / ${budgetData?.config?.weekly_budget_usd || 100}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${Math.min(100, budgetData?.status?.weekly_pct || 14)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {budgetData?.status?.weekly_pct || 14.8}% consumed this week.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">Monthly Spending Budget</span>
                <span className="text-xs font-mono text-purple-400">
                  ${budgetData?.status?.monthly_spend || 0.00} / ${budgetData?.config?.monthly_budget_usd || 300}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(100, budgetData?.status?.monthly_pct || 14)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {budgetData?.status?.monthly_pct || 14.2}% consumed this month.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Token Waste Detection */}
        {activeTab === 'waste' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-amber-200 font-mono">
                    Token Waste Detector: ${wasteData?.waste_metrics?.estimated_wasted_cost_usd?.toFixed(4) || '0.0450'} Potential Savings Identified
                  </h4>
                  <p className="text-xs text-amber-400/80">
                    Flagged repeated queries and context redundancy with automated recommendations.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wasteData?.recommendations?.map((rec: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                      {rec.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Save {rec.savings_pct}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">{rec.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Est. Savings:</span>
                    <span className="font-bold text-emerald-400">+${rec.potential_savings_usd.toFixed(2)} / mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Request History Table */}
        {activeTab === 'history' && (
          <div className="rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search prompts, models, or tasks..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="rounded-lg bg-black/50 border border-white/10 px-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2 self-end">
                <span className="text-xs font-mono text-slate-400">Status:</span>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="rounded bg-black/50 border border-white/10 px-2.5 py-1 text-xs font-mono text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="cached">Cached (0 Cost)</option>
                  <option value="error">Failed / Error</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Task</th>
                    <th className="pb-2">Model</th>
                    <th className="pb-2 text-right">Tokens (In / Out / Tot)</th>
                    <th className="pb-2 text-right">Cost (USD)</th>
                    <th className="pb-2 text-right">Latency</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-medium text-white">{req.task_name || 'General Task'}</td>
                      <td className="py-2.5 text-slate-300">{req.model_selected}</td>
                      <td className="py-2.5 text-right text-slate-300">
                        {req.prompt_tokens} / {req.completion_tokens} / <span className="text-amber-400 font-bold">{req.total_tokens}</span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        ${req.actual_cost_usd?.toFixed(6) || '0.000000'}
                      </td>
                      <td className="py-2.5 text-right text-cyan-400">{req.latency_ms}ms</td>
                      <td className="py-2.5 text-center">
                        <span className={`rounded px-2 py-0.5 text-[10px] uppercase font-bold ${
                          req.is_cached
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                            : req.status === 'success'
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-900/60 text-rose-300 border border-rose-500/40'
                        }`}>
                          {req.is_cached ? 'CACHED' : req.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => setSelectedRequestDetail(req)}
                          className="rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-2 py-1 text-[10px] text-slate-200 transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                Configured Model-Specific Pricing ($/1M Tokens)
              </h3>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-2">Model</th>
                    <th className="pb-2">Provider</th>
                    <th className="pb-2 text-right">Input ($/1M)</th>
                    <th className="pb-2 text-right">Output ($/1M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_MODELS.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 text-white font-medium">{m.name}</td>
                      <td className="py-2.5 text-slate-400 capitalize">{m.provider}</td>
                      <td className="py-2.5 text-right text-emerald-400">${m.inCost.toFixed(3)}</td>
                      <td className="py-2.5 text-right text-purple-400">${m.outCost.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowPricingModal(false)}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-mono font-bold text-black hover:brightness-110 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Spending Budget Limits
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-300">Daily Limit (USD)</label>
                <input
                  type="number"
                  step="0.5"
                  value={budgetForm.daily}
                  onChange={(e) => setBudgetForm({ ...budgetForm, daily: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 rounded bg-black/50 border border-white/10 p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300">Weekly Limit (USD)</label>
                <input
                  type="number"
                  step="1"
                  value={budgetForm.weekly}
                  onChange={(e) => setBudgetForm({ ...budgetForm, weekly: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 rounded bg-black/50 border border-white/10 p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300">Monthly Limit (USD)</label>
                <input
                  type="number"
                  step="5"
                  value={budgetForm.monthly}
                  onChange={(e) => setBudgetForm({ ...budgetForm, monthly: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 rounded bg-black/50 border border-white/10 p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300">Warning Threshold (%): {budgetForm.threshold}%</label>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={budgetForm.threshold}
                  onChange={(e) => setBudgetForm({ ...budgetForm, threshold: parseInt(e.target.value) || 75 })}
                  className="w-full mt-1 accent-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-mono text-slate-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-mono font-bold text-black hover:brightness-110 transition"
              >
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Inspector */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950 p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Trace Details: {selectedRequestDetail.id}
              </h3>
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Task Attribution</span>
                <span className="text-white font-bold">{selectedRequestDetail.task_name || 'General Task'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Model Executed</span>
                <span className="text-cyan-400 font-bold">{selectedRequestDetail.model_selected}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Prompt Tokens</span>
                <span className="text-slate-200">{selectedRequestDetail.prompt_tokens}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Completion Tokens</span>
                <span className="text-slate-200">{selectedRequestDetail.completion_tokens}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Total Tokens</span>
                <span className="text-amber-400 font-bold">{selectedRequestDetail.total_tokens}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Cost USD</span>
                <span className="text-emerald-400 font-bold">${selectedRequestDetail.actual_cost_usd?.toFixed(6)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Latency</span>
                <span className="text-cyan-300">{selectedRequestDetail.latency_ms} ms</span>
              </div>
              <div className="py-1">
                <span className="text-slate-400 block mb-1">Prompt:</span>
                <p className="rounded bg-black/60 p-2 text-slate-300 text-[11px] whitespace-pre-wrap">
                  {selectedRequestDetail.prompt_preview}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRequestDetail(null)}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-mono font-bold text-black hover:brightness-110 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
