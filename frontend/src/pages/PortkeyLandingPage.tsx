import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  TrendingDown,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  Code2,
  Sliders,
  DollarSign,
  ChevronRight,
  Flame,
  Globe,
  Gauge,
  Radio,
  FileCode2,
  BarChart3,
  Search,
  Eye,
  AlertTriangle
} from 'lucide-react';

export const PortkeyLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'openai' | 'portkey' | 'typescript' | 'curl' | 'langchain'>('openai');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'router' | 'cache' | 'guardrails' | 'calculator'>('router');

  // Simulator States
  // 1. Router Simulator
  const [routerPromptTokens, setRouterPromptTokens] = useState(1200);
  const [routerMaxLatency, setRouterMaxLatency] = useState(400);
  const [routerNeedsJson, setRouterNeedsJson] = useState(true);
  const [routerNeedsVision, setRouterNeedsVision] = useState(false);

  // 2. Cache Simulator
  const [cacheQuery, setCacheQuery] = useState('Explain retrieval augmented generation (RAG) architecture in 3 bullet points.');
  const [cacheRunning, setCacheRunning] = useState(false);
  const [cacheStep, setCacheStep] = useState<0 | 1 | 2>(0); // 0=initial, 1=miss, 2=hit

  // 3. Guardrail Simulator
  const [guardrailInput, setGuardrailInput] = useState('User account transfer requested by user: admin@company.com with credit card 4532-8921-9923-1029 and SSN 000-12-3456.');
  const [guardrailResult, setGuardrailResult] = useState<string | null>(null);

  // 4. Calculator State
  const [monthlyRequests, setMonthlyRequests] = useState(500000);
  const [avgTokensPerReq, setAvgTokensPerReq] = useState(1800);

  // Architecture pipeline animation step
  const [pipelineStep, setPipelineStep] = useState(0);
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState(false);

  const startPipelineSimulation = () => {
    setIsSimulatingPipeline(true);
    setPipelineStep(1);
    const intervals = [
      setTimeout(() => setPipelineStep(2), 500),
      setTimeout(() => setPipelineStep(3), 1100),
      setTimeout(() => setPipelineStep(4), 1700),
      setTimeout(() => setPipelineStep(5), 2300),
      setTimeout(() => setPipelineStep(6), 2900),
      setTimeout(() => setIsSimulatingPipeline(false), 3500)
    ];
    return () => intervals.forEach(clearTimeout);
  };

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('pip install aivalueguard-portkey');
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const codeSnippets = {
    openai: `from openai import OpenAI

# 1. Point standard OpenAI client to Portkey Gateway
client = OpenAI(
    api_key="avg_live_7x90q2k8a1m",
    base_url="https://gateway.aivalueguard.ai/v1",
    default_headers={
        "x-portkey-provider": "openai",
        "x-portkey-cache": "semantic",
        "x-portkey-retry": "3",
        "x-portkey-fallback": "claude-3-5-sonnet"
    }
)

# 2. Invoke as usual - automatic routing, caching & tracing!
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze customer support sentiment."}],
    temperature=0.2
)
print(response.choices[0].message.content)`,

    portkey: `from portkey_ai import Portkey

# Initialize Portkey with zero-latency gateway
portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    virtual_key="openai-prod-key",
    trace_id="user_session_49201"
)

# Automatic multi-model fallback, caching, and guardrail verification
response = portkey.chat.completions.create(
    messages=[{"role": "user", "content": "Generate structured user profile."}],
    model="gpt-4o",
    config={
        "retry": {"count": 3},
        "cache": {"mode": "semantic", "ttl": 86400},
        "guardrails": ["pii-filter", "json-schema-enforcer"]
    }
)`,

    typescript: `import { Portkey } from 'portkey-ai';

// Drop-in TypeScript gateway client
const portkey = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY,
  virtualKey: 'org-universal-key'
});

async function runInference() {
  const completion = await portkey.chat.completions.create({
    messages: [{ role: 'user', content: 'Extract key financial line items' }],
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.1,
  });

  console.log(completion.choices[0].message);
}`,

    curl: `curl -X POST "https://gateway.aivalueguard.ai/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer avg_live_7x90q2k8a1m" \\
  -H "x-portkey-provider: anthropic" \\
  -H "x-portkey-cache: semantic" \\
  -H "x-portkey-fallback: gemini-1.5-flash" \\
  -d '{
    "model": "claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "Categorize incoming support ticket."}]
  }'`,

    langchain: `from langchain_openai import ChatOpenAI

# LangChain integration via standard base_url
llm = ChatOpenAI(
    openai_api_key="avg_live_7x90q2k8a1m",
    openai_api_base="https://gateway.aivalueguard.ai/v1",
    model="gpt-4o",
    default_headers={"x-portkey-routing": "lowest-cost-eligible"}
)

response = llm.invoke("Summarize policy documentation.")
print(response.content)`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Dynamic Router calculation
  const eligibleRouterModel = () => {
    if (routerNeedsVision) {
      return {
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        costPerM: '$0.150 / 1M',
        latency: '340ms',
        reason: 'Selected lowest cost vision-capable model meeting 400ms SLA',
        savings: '94% cheaper than raw GPT-4o'
      };
    }
    if (routerMaxLatency <= 300) {
      return {
        name: 'Llama 3.3 70B (Groq)',
        provider: 'Groq',
        costPerM: '$0.590 / 1M',
        latency: '185ms',
        reason: 'Selected fastest ultra-low latency inference tier (<200ms)',
        savings: '82% savings vs Baseline'
      };
    }
    if (routerNeedsJson && routerPromptTokens > 2000) {
      return {
        name: 'Gemini 1.5 Flash',
        provider: 'Google Cloud',
        costPerM: '$0.075 / 1M',
        latency: '260ms',
        reason: 'Selected lowest cost large-context model with strict JSON support',
        savings: '97% savings vs Raw GPT-4o'
      };
    }
    return {
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      costPerM: '$0.800 / 1M',
      latency: '290ms',
      reason: 'Optimal balance of reasoning quality score (91) and speed',
      savings: '68% savings vs GPT-4o baseline'
    };
  };

  // Calculator calculations
  const calculateSavings = () => {
    // Baseline raw GPT-4o blended rate: ~$6.00 per 1M tokens
    const totalTokensMillions = (monthlyRequests * avgTokensPerReq) / 1000000;
    const rawCost = totalTokensMillions * 6.25;
    // With Portkey: 35% cached ($0), 45% routed to cheaper model ($0.60/M), 20% baseline ($6.25/M)
    const cachedTokens = totalTokensMillions * 0.35;
    const routedTokens = totalTokensMillions * 0.45;
    const baselineTokens = totalTokensMillions * 0.20;

    const optimizedCost = (routedTokens * 0.65) + (baselineTokens * 6.25);
    const savedCost = rawCost - optimizedCost;
    const savingsPercent = Math.round((savedCost / rawCost) * 100);

    return {
      rawCost: Math.round(rawCost),
      optimizedCost: Math.round(optimizedCost),
      savedCost: Math.round(savedCost),
      savingsPercent: Math.min(savingsPercent, 88),
      co2SavedKg: Math.round(totalTokensMillions * 1.8)
    };
  };

  const savings = calculateSavings();

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Subtle Glows (low opacity to leave background video razor-sharp) */}
      <div className="fixed inset-0 bg-grid-obsidian pointer-events-none opacity-10 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-radial-glow pointer-events-none opacity-15 z-0" />
      <div className="fixed top-[600px] -right-40 w-[600px] h-[600px] bg-radial-cyan pointer-events-none opacity-10 z-0" />

      {/* Global Portkey Banner Switcher */}
      <div className="relative z-50 bg-gradient-to-r from-cyan-950/80 via-black to-slate-950/90 border-b border-cyan-500/20 px-4 py-2 text-xs flex items-center justify-between backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-cyan-400">Portkey AI Architecture</span>
            <span className="hidden sm:inline text-slate-400">— Full Production Gateway, Observability, Guardrails & Console Live</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px] hidden md:inline">Ready to test real queries?</span>
            <Link
              to="/console"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs transition shadow-sm shadow-cyan-500/30"
            >
              Open Live Console <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Floating Nav Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-obsidian-950/70 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 text-black shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
              <Flame className="h-6 w-6 fill-black/20" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  Portkey<span className="text-cyan-400">.ai</span>
                </span>
                <span className="rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold">
                  GATEWAY v2.5
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Production Stack for Gen AI Builders</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#gateway" className="hover:text-cyan-400 transition">AI Gateway</a>
            <a href="#observability" className="hover:text-cyan-400 transition">Observability</a>
            <a href="#guardrails" className="hover:text-cyan-400 transition">Guardrails</a>
            <a href="#prompts" className="hover:text-cyan-400 transition">Prompts</a>
            <a href="#demo" className="hover:text-cyan-400 transition">Live Demo</a>
            <a href="#pricing" className="hover:text-cyan-400 transition">Pricing</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* GitHub Stars Badge */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>GitHub</span>
              <span className="rounded bg-white/10 px-1 py-0.2 text-[10px] text-slate-400">★ 4.8k</span>
            </a>

            {/* Launch Console CTA */}
            <Link
              to="/console"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition duration-200 border border-cyan-400/30"
            >
              <span>Launch Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300 mb-8 backdrop-blur-md hover:border-cyan-500/40 transition group cursor-pointer"
          onClick={() => navigate('/console')}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-white">Portkey AI Gateway 2.5 Live</span>
          <span className="text-slate-400">• Multi-Model Routing, Traces & Safe Caching</span>
          <ArrowRight className="h-3 w-3 text-cyan-400 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading tracking-wide uppercase font-extrabold text-white max-w-5xl mx-auto leading-[1.12]">
          Production Stack for <br className="hidden sm:inline" />
          <span className="text-gradient-fire">Gen AI Builders</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Democratize and scale Gen AI across your entire organization with Portkey’s suite of{' '}
          <span className="text-white font-medium">universal AI gateway</span>,{' '}
          <span className="text-white font-medium">real-time observability</span>,{' '}
          <span className="text-white font-medium">guardrails</span>, and{' '}
          <span className="text-white font-medium">cryptographic caching</span>.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/console"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition duration-200 flex items-center gap-2 border border-cyan-400/40"
          >
            <span>Start Free in 2 Minutes</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#demo"
            className="px-6 py-3.5 rounded-xl bg-obsidian-card hover:bg-obsidian-card-hover border border-obsidian-border hover:border-cyan-500/40 text-slate-200 font-semibold text-sm transition flex items-center gap-2"
          >
            <Play className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
            <span>Interactive Demo</span>
          </a>

          <Link
            to="/playground"
            className="px-6 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 font-semibold text-sm transition flex items-center gap-2"
          >
            <Terminal className="h-4 w-4 text-slate-400" />
            <span>Model Playground</span>
          </Link>
        </div>

        {/* Terminal Command One-Liner */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-obsidian-card border border-obsidian-border text-xs font-mono text-slate-300 shadow-inner">
            <span className="text-cyan-400">$</span>
            <span>pip install aivalueguard-portkey</span>
            <button
              onClick={handleCopyInstall}
              className="p-1 text-slate-400 hover:text-white transition ml-2 rounded hover:bg-white/10"
              title="Copy install command"
            >
              {copiedInstall ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
          {[
            { label: 'Models Unified', val: '100+', sub: 'OpenAI, Claude, Gemini, Groq', color: 'text-cyan-400' },
            { label: 'Gateway Overhead', val: '< 1ms', sub: 'Sub-millisecond proxy layer', color: 'text-cyan-400' },
            { label: 'Verified Cost Cut', val: '68.4%', sub: 'Caching & smart routing', color: 'text-emerald-400' },
            { label: 'Uptime SLA', val: '99.999%', sub: 'Zero-downtime multi-fallback', color: 'text-purple-400' },
            { label: 'Tokens Monitored', val: '14.2B+', sub: 'OpenTelemetry distributed', color: 'text-amber-400' },
          ].map((metric, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl text-left border border-white/[0.06] hover:border-white/20 transition group"
            >
              <div className={`text-2xl font-bold font-mono tracking-tight ${metric.color}`}>
                {metric.val}
              </div>
              <div className="text-xs font-semibold text-white mt-1">{metric.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{metric.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Model Providers Ecosystem Strip */}
      <section className="relative z-10 py-10 border-y border-white/[0.06] bg-obsidian-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-widest font-mono text-slate-500 mb-6">
            Universal Gateway Across 100+ Enterprise LLMs & Providers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75">
            {[
              { name: 'OpenAI', tier: 'GPT-4o, o1, o3-mini' },
              { name: 'Anthropic', tier: 'Claude 3.5 Sonnet & Haiku' },
              { name: 'Google Gemini', tier: 'Gemini 1.5 Pro & Flash' },
              { name: 'Groq', tier: 'Llama 3.3 70B Ultra-Fast' },
              { name: 'Mistral AI', tier: 'Mistral Large 2 & Codestral' },
              { name: 'DeepSeek', tier: 'DeepSeek V3 & R1' },
              { name: 'AWS Bedrock', tier: 'Multi-Region IAM' },
              { name: 'Azure OpenAI', tier: 'Enterprise VPC' }
            ].map((p, i) => (
              <div key={i} className="flex flex-col items-center group cursor-pointer hover:opacity-100 transition">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition">
                  {p.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{p.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Visualizer Section: Universal Gateway Pipeline */}
      <section id="gateway" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-3">
            <Cpu className="h-3.5 w-3.5" /> PIPELINE ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading tracking-wide uppercase font-extrabold tracking-tight text-white">
            How The Universal Gateway Works
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Every request travels through Portkey’s intelligent sub-millisecond pipeline to guarantee zero downtime,
            the lowest dollar cost, and strict compliance.
          </p>
        </div>

        {/* Interactive Pipeline Graph */}
        <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs font-semibold text-slate-300">
                LIVE PIPELINE INSPECTOR
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Click "Simulate Request" to watch packet flow
              </span>
            </div>

            <button
              onClick={startPipelineSimulation}
              disabled={isSimulatingPipeline}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm shadow-cyan-500/30"
            >
              <Play className="h-3 w-3" />
              <span>{isSimulatingPipeline ? 'Routing Request...' : 'Simulate Request Flow'}</span>
            </button>
          </div>

          {/* Flow Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
            {[
              {
                step: 1,
                name: '1. Ingestion',
                sub: 'SDK / API Call',
                detail: '< 0.4ms overhead',
                desc: 'Universal OpenAI format parsed'
              },
              {
                step: 2,
                name: '2. Safe Cache',
                sub: 'Exact & Semantic',
                detail: '0ms Latency on Hit',
                desc: 'SHA-256 tenant isolated fingerprint'
              },
              {
                step: 3,
                name: '3. Compaction',
                sub: 'Context Trimming',
                detail: 'Up to 38% tokens saved',
                desc: 'Compacts repetitive system context'
              },
              {
                step: 4,
                name: '4. Smart Router',
                sub: 'Multi-Criteria Engine',
                detail: 'Lowest-cost eligible',
                desc: 'Filters by SLA, cost & JSON capabilities'
              },
              {
                step: 5,
                name: '5. Provider Exec',
                sub: 'Fallback Matrix',
                detail: 'OpenAI/Claude/Gemini',
                desc: 'Auto-retries on 429/500 errors'
              },
              {
                step: 6,
                name: '6. Guardrails',
                sub: 'Schema & PII Audit',
                detail: '100% Validated',
                desc: 'Logs distributed trace telemetry'
              }
            ].map((node) => {
              const isCurrent = pipelineStep === node.step;
              const isPassed = pipelineStep > node.step;
              return (
                <div
                  key={node.step}
                  className={`p-4 rounded-xl border transition-all duration-300 text-left relative ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20'
                      : isPassed
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                      : 'bg-obsidian-card border-obsidian-border text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {node.name}
                    </span>
                    {isCurrent && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                    {isPassed && (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-white">{node.sub}</div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-1">{node.detail}</div>
                  <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">{node.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Simulation Output Banner */}
          {pipelineStep > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-obsidian-850 border border-obsidian-border text-xs flex flex-wrap items-center justify-between gap-4 font-mono animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓ Execution Verdict:</span>
                <span className="text-slate-300">
                  {pipelineStep < 6
                    ? `Processing step ${pipelineStep}/6...`
                    : 'Target Model: Gemini 1.5 Flash (via Groq/Google) • Latency: 240ms • Saved: $0.00342 (86% vs GPT-4o Baseline)'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Overhead: <span className="text-white">0.82ms</span></span>
                <span>Trace ID: <span className="text-white">tr_9a87f2b1</span></span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2-Line Integration Code Switcher */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-3">
              <Code2 className="h-3.5 w-3.5" /> 2 LINES OF CODE
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading tracking-wide uppercase font-extrabold tracking-tight text-white leading-tight">
              Integrate in 60 Seconds with Zero Refactoring
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed text-sm sm:text-base">
              Portkey is completely compatible with the standard OpenAI SDK, LangChain, LlamaIndex, or raw cURL.
              Just switch your <code className="text-cyan-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">base_url</code> to Portkey and instantly unlock caching, fallbacks, model routing, and OpenTelemetry logging.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                'Zero changes to prompts, tools, or completion format',
                'Automatic retry with exponential backoff on 429 rate limits',
                'Cryptographic tenant isolation and budget boundaries',
                'Pre-configured client SDKs for Python, TypeScript, and Go'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/console"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs tracking-wide shadow-md shadow-cyan-500/20 transition flex items-center gap-2"
              >
                <span>Generate Gateway API Key</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Code Window Box */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-obsidian-card shadow-2xl overflow-hidden text-left">
              {/* Tab Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-obsidian-850/60">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  {/* Language Selector */}
                  <div className="flex gap-1">
                    {(['openai', 'portkey', 'typescript', 'curl', 'langchain'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition ${
                          activeCodeTab === tab
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab === 'openai' && 'Python (OpenAI)'}
                        {tab === 'portkey' && 'Portkey SDK'}
                        {tab === 'typescript' && 'TypeScript'}
                        {tab === 'curl' && 'cURL'}
                        {tab === 'langchain' && 'LangChain'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/5 font-mono"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Code Pre Area */}
              <div className="p-5 font-mono text-xs overflow-x-auto leading-relaxed text-slate-300 bg-[#070a10]">
                <pre>{codeSnippets[activeCodeTab]}</pre>
              </div>

              {/* Status bar */}
              <div className="border-t border-white/10 px-4 py-2 bg-obsidian-850/40 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Gateway Status: READY (Sub-ms routing enabled)
                </span>
                <span className="text-cyan-400">Zero Code Modifications Needed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Pillars Bento Grid (Portkey's 4 Modules) */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-medium mb-3">
            <Layers className="h-3.5 w-3.5" /> 4 CORE MODULES
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading tracking-wide uppercase font-extrabold tracking-tight text-white">
            The Complete Control Plane for LLMs
          </h2>
          <p className="mt-4 text-base text-slate-400">
            A modular production stack designed specifically for enterprise reliability, observability, and compliance.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: AI Gateway */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl border border-white/10 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                01. AI GATEWAY
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Universal AI Gateway</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Connect to 100+ models using a single unified API. Set up intelligent fallbacks to automatically reroute traffic when a primary model throttles or fails, enforce budget boundaries, and load balance across multiple keys.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">AUTOMATED FALLBACK</span>
                <span className="text-white font-medium">Zero 500 Failures</span>
              </div>
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">SEMANTIC CACHING</span>
                <span className="text-emerald-400 font-medium">&lt; 10ms Response</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Observability & Traces */}
          <div id="observability" className="glass-panel glass-panel-hover p-8 rounded-2xl border border-white/10 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition">
                <Activity className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                02. OBSERVABILITY
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Real-Time OpenTelemetry Tracing</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Complete visibility into every LLM invocation. Track Time to First Token (TTFT), latency percentiles (P50/P95/P99), cost attribution per team or user, and inspect the complete distributed trace of complex agentic workflows.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">TELEMETRY STANDARD</span>
                <span className="text-cyan-400 font-medium">OpenTelemetry Native</span>
              </div>
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">EXECUTION TRACE</span>
                <span className="text-white font-medium">Full Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: AI Guardrails */}
          <div id="guardrails" className="glass-panel glass-panel-hover p-8 rounded-2xl border border-white/10 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-105 transition">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs font-bold text-purple-400 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                03. GUARDRAILS
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Enterprise AI Guardrails</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Enforce structural validation, block prompt injections and jailbreaks before LLMs receive them, scrub PII (SSNs, credit cards, emails), and detect model refusals to trigger bounded recovery escalations automatically.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">SCHEMA GUARANTEE</span>
                <span className="text-purple-400 font-medium">JSON Syntax Enforced</span>
              </div>
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">DATA PROTECTION</span>
                <span className="text-white font-medium">Real-Time PII Masking</span>
              </div>
            </div>
          </div>

          {/* Pillar 4: Prompt Management */}
          <div id="prompts" className="glass-panel glass-panel-hover p-8 rounded-2xl border border-white/10 transition-all duration-300 text-left group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition">
                <Terminal className="h-6 w-6" />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                04. PROMPT MANAGEMENT
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Prompt Library & Test Bench</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Version control prompts independently of application deployments. Test and compare prompt variations side-by-side across 100+ models in the interactive playground arena, with instantaneous non-breaking rollbacks.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">DEPLOYMENTS</span>
                <span className="text-white font-medium">Zero-Downtime Push</span>
              </div>
              <div className="p-3 rounded-lg bg-obsidian-850/80 border border-white/5">
                <span className="text-slate-400 block text-[10px]">MODEL ARENA</span>
                <span className="text-emerald-400 font-medium">Side-by-Side Eval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase Simulator (LIVE DEMO ON HOMEPAGE) */}
      <section id="demo" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-3">
            <Sliders className="h-3.5 w-3.5" /> TEST BENCH
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading tracking-wide uppercase font-extrabold tracking-tight text-white">
            Try Portkey Right Now
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Experience the multi-model router, safe caching system, guardrail defense, and cost calculator live in your browser.
          </p>
        </div>

        {/* Feature Simulator Container */}
        <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-left">
          {/* Tab Selector */}
          <div className="flex border-b border-white/10 bg-obsidian-850/70 p-2 overflow-x-auto">
            {[
              { id: 'router', label: '1. Multi-Criteria Router Simulator', icon: Cpu },
              { id: 'cache', label: '2. Safe Semantic Cache Demo', icon: Database },
              { id: 'guardrails', label: '3. Real-Time Guardrail Defense', icon: ShieldCheck },
              { id: 'calculator', label: '4. ROI Cost Savings Calculator', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    activeFeatureTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 text-black shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 sm:p-10">
            {/* Tab 1: Smart Router Simulator */}
            {activeFeatureTab === 'router' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Dynamic Model Router Decision Matrix</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Adjust request constraints below. Portkey evaluates token limits, SLA boundaries, and quality requirements to pick the lowest-cost capable model in under 1ms.
                    </p>
                  </div>

                  {/* Constraint 1: Prompt Tokens Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-slate-300">Prompt Context Length:</span>
                      <span className="text-cyan-400 font-bold">{routerPromptTokens.toLocaleString()} tokens</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={12000}
                      step={200}
                      value={routerPromptTokens}
                      onChange={(e) => setRouterPromptTokens(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-obsidian-border rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Constraint 2: Max Latency SLA */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-slate-300">Latency SLA Constraint:</span>
                      <span className="text-cyan-400 font-bold">&lt; {routerMaxLatency}ms</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={1500}
                      step={50}
                      value={routerMaxLatency}
                      onChange={(e) => setRouterMaxLatency(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-obsidian-border rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Constraint Toggles */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routerNeedsJson}
                        onChange={(e) => setRouterNeedsJson(e.target.checked)}
                        className="rounded accent-cyan-400 h-4 w-4"
                      />
                      <span>Strict JSON Schema Output</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routerNeedsVision}
                        onChange={(e) => setRouterNeedsVision(e.target.checked)}
                        className="rounded accent-cyan-400 h-4 w-4"
                      />
                      <span>Vision Input Required</span>
                    </label>
                  </div>
                </div>

                {/* Router Decision Card */}
                <div className="lg:col-span-6">
                  {(() => {
                    const decision = eligibleRouterModel();
                    return (
                      <div className="rounded-2xl border border-cyan-500/30 bg-obsidian-850 p-6 relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                          <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                            <Zap className="h-4 w-4" /> ROUTER DECISION VERDICT
                          </span>
                          <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono">
                            ACTIVE
                          </span>
                        </div>

                        <div className="mt-4">
                          <span className="text-xs text-slate-400 font-mono">CHOSEN INFERENCE ENGINE</span>
                          <div className="text-2xl font-bold text-white mt-0.5">{decision.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">Provider: {decision.provider}</div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-mono">
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-slate-400 block text-[10px]">ESTIMATED COST</span>
                            <span className="text-white font-bold">{decision.costPerM}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-slate-400 block text-[10px]">ESTIMATED LATENCY</span>
                            <span className="text-cyan-400 font-bold">{decision.latency}</span>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                          <div className="font-semibold text-cyan-400">Decision Rationale:</div>
                          <div className="text-[11px] mt-0.5">{decision.reason}</div>
                          <div className="text-emerald-400 font-bold text-[11px] mt-1">{decision.savings}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Tab 2: Cache Simulator */}
            {activeFeatureTab === 'cache' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Safe Semantic & Exact Caching</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Portkey generates SHA-256 cryptographic fingerprints incorporating prompt, workspace tenant, system instructions, and temperature.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">Test Query Prompt:</label>
                    <textarea
                      value={cacheQuery}
                      onChange={(e) => setCacheQuery(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl bg-obsidian-850 border border-obsidian-border p-3 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCacheRunning(true);
                        setTimeout(() => {
                          setCacheStep(cacheStep === 1 ? 2 : 1);
                          setCacheRunning(false);
                        }, 500);
                      }}
                      disabled={cacheRunning}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm shadow-cyan-500/30"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{cacheStep === 0 ? 'Send 1st Request (Cache Miss)' : cacheStep === 1 ? 'Send 2nd Request (Cache Hit)' : 'Re-send Request'}</span>
                    </button>

                    <button
                      onClick={() => setCacheStep(0)}
                      className="px-3 py-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-border border border-obsidian-border text-slate-300 text-xs flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-6 shadow-xl text-xs font-mono">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-slate-400">CACHE TELEMETRY INSPECTOR</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cacheStep === 2
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : cacheStep === 1
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {cacheStep === 2 ? '⚡ CACHE HIT (< 5ms)' : cacheStep === 1 ? 'FETCHING FROM LLM (MISS)' : 'STANDBY'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">SHA-256 Fingerprint:</span>
                        <span className="text-slate-200">f7a9c0182bde...39ac</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Response Latency:</span>
                        <span className={`font-bold ${cacheStep === 2 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {cacheStep === 2 ? '4.8 ms (Local Fast Store)' : cacheStep === 1 ? '410.2 ms (Upstream OpenAI)' : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Billed Tokens:</span>
                        <span className={`font-bold ${cacheStep === 2 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {cacheStep === 2 ? '0 Tokens (100% Free)' : cacheStep === 1 ? '348 Tokens' : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dollar Cost:</span>
                        <span className={`font-bold ${cacheStep === 2 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {cacheStep === 2 ? '$0.000000 (100% Saved)' : cacheStep === 1 ? '$0.003480' : '--'}
                        </span>
                      </div>
                    </div>

                    {cacheStep === 2 && (
                      <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed">
                        ✓ Exact-match fingerprint verified against tenant workspace. Zero tokens dispatched to external model provider.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Guardrail Simulator */}
            {activeFeatureTab === 'guardrails' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Live Guardrail & PII Scrubbing</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Intercept sensitive customer records, credit card numbers, and SSNs in real-time before payloads ever leave your enterprise network perimeter.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">Input Payload with Sensitive Data:</label>
                    <textarea
                      value={guardrailInput}
                      onChange={(e) => setGuardrailInput(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl bg-obsidian-850 border border-obsidian-border p-3 text-xs text-slate-200 focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const scrubbed = guardrailInput
                        .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[REDACTED_CARD_NUMBER]')
                        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
                        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
                      setGuardrailResult(scrubbed);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-md shadow-purple-600/30"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Run Guardrail Interception</span>
                  </button>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-white/10 bg-obsidian-850 p-6 shadow-xl text-xs font-mono">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-slate-400">SANITIZED OUTPUT PAYLOAD</span>
                      <span className="text-purple-400 font-bold">PII & SCHEMA ENFORCED</span>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-black/50 border border-white/5 text-slate-200 leading-relaxed min-h-[100px]">
                      {guardrailResult || <span className="text-slate-500 italic">Click "Run Guardrail Interception" to preview masked payload...</span>}
                    </div>

                    {guardrailResult && (
                      <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>3 Security Violations Intercepted & Masked Successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: ROI Cost Calculator */}
            {activeFeatureTab === 'calculator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Interactive Enterprise ROI Calculator</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      See how much your organization saves each month through exact caching, context reduction, and multi-model routing.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-slate-300">Monthly AI Requests:</span>
                      <span className="text-cyan-400 font-bold">{monthlyRequests.toLocaleString()} requests/mo</span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={5000000}
                      step={50000}
                      value={monthlyRequests}
                      onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-obsidian-border rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-slate-300">Average Tokens per Request:</span>
                      <span className="text-cyan-400 font-bold">{avgTokensPerReq.toLocaleString()} tokens</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={8000}
                      step={100}
                      value={avgTokensPerReq}
                      onChange={(e) => setAvgTokensPerReq(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-obsidian-border rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-emerald-500/30 bg-obsidian-850 p-6 shadow-xl text-left">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      CALCULATED MONTHLY SAVINGS
                    </span>
                    <div className="text-4xl font-extrabold text-white mt-1 mono-nums">
                      ${savings.savedCost.toLocaleString()} <span className="text-lg font-normal text-slate-400">/ month</span>
                    </div>
                    <div className="text-xs text-emerald-400 font-mono mt-1">
                      {savings.savingsPercent}% Net Reduction vs Direct Upstream Invocation
                    </div>

                    <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Unoptimized Baseline Cost:</span>
                        <span className="text-rose-400 font-semibold">${savings.rawCost.toLocaleString()} /mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Optimized with Portkey:</span>
                        <span className="text-emerald-400 font-semibold">${savings.optimizedCost.toLocaleString()} /mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annual Estimated Savings:</span>
                        <span className="text-white font-bold">${(savings.savedCost * 12).toLocaleString()} /yr</span>
                      </div>
                    </div>

                    <Link
                      to="/console"
                      className="mt-6 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                    >
                      <span>Start Capturing Savings Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enterprise Security & Compliance Badges */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-white">Enterprise-Ready Architecture</h3>
          <p className="text-slate-400 text-sm mt-2">
            Built for mission-critical deployments with bank-grade security and full data sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'SOC 2 Type II', desc: 'Independently audited & verified compliance controls' },
            { title: 'HIPAA & GDPR Ready', desc: 'Zero data retention (ZDR) mode guaranteed' },
            { title: 'Multi-Tenant Isolation', desc: 'Cryptographically separated workspace vaults' },
            { title: 'Deploy Anywhere', desc: 'Cloud, VPC Peering, Docker or On-Premise airgapped' }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 text-left">
              <Lock className="h-5 w-5 text-cyan-400 mb-2" />
              <div className="font-bold text-sm text-white">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Comparison */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium mb-3">
            PRICING PLANS
          </div>
          <h2 className="text-3xl sm:text-5xl font-heading tracking-wide uppercase font-extrabold tracking-tight text-white">
            Transparent Pricing That Scales
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Start free with full features. Upgrade as your production throughput grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Plan 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">DEVELOPER</span>
              <div className="text-3xl font-extrabold text-white mt-2">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
              <p className="text-xs text-slate-400 mt-2">Ideal for prototyping, hackathons & indie AI engineers.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Up to 50,000 requests/mo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 100+ Model Integrations</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Safe Semantic Caching</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Multi-Model Playground</li>
              </ul>
            </div>
            <Link
              to="/console"
              className="mt-8 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 to-obsidian-card relative flex flex-col justify-between shadow-2xl shadow-cyan-500/10">
            <span className="absolute -top-3 right-6 bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 text-black text-[10px] font-extrabold font-mono px-3 py-0.5 rounded-full uppercase tracking-wider">
              POPULAR FOR SCALE
            </span>
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">TEAM PRODUCTION</span>
              <div className="text-3xl font-extrabold text-white mt-2">$49 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-400 mt-2">For growing startups with high-volume production traffic.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 2,000,000 requests/mo included</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Dynamic Model Smart Router</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Full OpenTelemetry Traces</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Automated Fallback Matrix</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Real-time Guardrails & PII</li>
              </ul>
            </div>
            <Link
              to="/console"
              className="mt-8 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-xs text-center tracking-wide shadow-lg shadow-cyan-500/25 transition"
            >
              Start 14-Day Pro Trial
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">ENTERPRISE</span>
              <div className="text-3xl font-extrabold text-white mt-2">Custom</div>
              <p className="text-xs text-slate-400 mt-2">For organizations requiring strict governance, VPC peering, and custom SLAs.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Unlimited throughput volume</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> On-Premise / VPC deployment</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> 99.999% Dedicated SLA</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Dedicated Enterprise Slack</li>
              </ul>
            </div>
            <Link
              to="/console"
              className="mt-8 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs text-center transition"
            >
              Contact Solutions Team
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Big CTA */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-obsidian-card to-obsidian-card p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial-glow pointer-events-none opacity-40" />

          <h2 className="text-3xl sm:text-5xl font-heading tracking-wide uppercase font-extrabold text-white max-w-3xl mx-auto tracking-tight">
            Ready to Productionize Your Gen AI Stack?
          </h2>
          <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto">
            Join thousands of developers routing over 14 Billion tokens through Portkey with zero latency overhead.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/console"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 hover:opacity-95 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/30 transition flex items-center gap-2"
            >
              <span>Launch Gateway Console</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/playground"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-sm transition"
            >
              Explore Playground
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-obsidian-950/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-black font-bold">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Portkey AI</span>
              <span className="text-slate-500 ml-2">© 2026 Portkey AI & AIValueGuard</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link to="/console" className="hover:text-white transition">Gateway Console</Link>
            <Link to="/playground" className="hover:text-white transition">Model Playground</Link>
            <Link to="/requests" className="hover:text-white transition">Audit Logs</Link>
            <Link to="/settings" className="hover:text-white transition">API Keys</Link>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (99.999%)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
