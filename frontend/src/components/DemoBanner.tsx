import React from 'react';
import { Sparkles, Key, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoBannerProps {
  isDemo: boolean;
  onToggleDemo: () => void;
  hasConfiguredKeys: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  isDemo,
  onToggleDemo,
  hasConfiguredKeys
}) => {
  return (
    <div
      className={`border-b px-6 py-2.5 flex items-center justify-between text-xs transition-colors backdrop-blur-md ${
        isDemo
          ? 'bg-amber-950/40 border-amber-500/20 text-amber-200'
          : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
            isDemo
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {isDemo ? (
            <>
              <Sparkles className="h-3 w-3 animate-spin" /> DEMO MODE
            </>
          ) : (
            <>
              <Key className="h-3 w-3" /> LIVE GATEWAY MODE
            </>
          )}
        </span>

        <span className="text-slate-300">
          {isDemo
            ? 'Operating in deterministic demonstration mode with simulated tokens, latencies, and stored evaluation sets for zero-key evaluation.'
            : 'Executing real requests through configured upstream AI providers (OpenAI, Anthropic, Gemini, Groq).'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!hasConfiguredKeys && isDemo && (
          <Link
            to="/settings"
            className="hidden md:inline-flex items-center gap-1 font-medium text-amber-300 underline hover:text-amber-200"
          >
            Configure Provider API Keys <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <button
          onClick={onToggleDemo}
          className={`px-3 py-1 rounded-lg font-medium text-xs border shadow-sm transition ${
            isDemo
              ? 'bg-obsidian-850 border-amber-500/40 text-amber-300 hover:bg-amber-950/40'
              : 'bg-obsidian-850 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40'
          }`}
        >
          Switch to {isDemo ? 'Live Mode' : 'Demo Mode'}
        </button>
      </div>
    </div>
  );
};
