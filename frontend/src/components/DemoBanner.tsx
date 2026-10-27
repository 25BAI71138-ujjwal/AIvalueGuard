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
      className={`border-b px-6 py-2.5 flex items-center justify-between text-xs transition-colors ${
        isDemo
          ? 'bg-amber-50/70 border-amber-200/60 text-amber-900'
          : 'bg-emerald-50/70 border-emerald-200/60 text-emerald-900'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
            isDemo
              ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
              : 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
          }`}
        >
          {isDemo ? (
            <>
              <Sparkles className="h-3 w-3" /> DEMO MODE
            </>
          ) : (
            <>
              <Key className="h-3 w-3" /> LIVE PROVIDER MODE
            </>
          )}
        </span>

        <span className="text-slate-700">
          {isDemo
            ? 'Operating in deterministic demonstration mode with simulated tokens, latencies, and stored evaluation sets for zero-key evaluation.'
            : 'Executing real requests through configured external AI providers (OpenAI, Anthropic, Gemini, Groq).'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!hasConfiguredKeys && isDemo && (
          <Link
            to="/settings"
            className="hidden md:inline-flex items-center gap-1 font-medium text-amber-900 underline hover:text-amber-950"
          >
            Configure Provider API Keys <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <button
          onClick={onToggleDemo}
          className={`px-3 py-1 rounded-md font-medium text-xs border shadow-sm transition ${
            isDemo
              ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50'
              : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-100/50'
          }`}
        >
          Switch to {isDemo ? 'Live Mode' : 'Demo Mode'}
        </button>
      </div>
    </div>
  );
};
