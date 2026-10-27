import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  Database,
  Sliders,
  CheckCircle2,
  Sparkles,
  Save,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { SettingsData } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Key input states
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [toast, setToast] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setSettings(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveKey = async (provider: string, value: string) => {
    if (!value.trim()) return;
    try {
      setSavingKey(provider);
      const res = await api.updateSetting(`${provider}_api_key`, value);
      setToast(res.message);
      await loadSettings();
      // Clear local input after save for safety
      if (provider === 'openai') setOpenaiKey('');
      if (provider === 'anthropic') setAnthropicKey('');
      if (provider === 'gemini') setGeminiKey('');
      if (provider === 'groq') setGroqKey('');
      setTimeout(() => setToast(null), 3500);
    } catch (e: any) {
      alert(`Failed to save key: ${e.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleDemo = async () => {
    try {
      const res = await api.toggleDemoMode();
      setToast(res.message);
      await loadSettings();
      setTimeout(() => setToast(null), 3500);
    } catch (e) {
      alert("Failed to toggle demo mode");
    }
  };

  const handleUpdateBaseline = async (model: string) => {
    try {
      await api.updateSetting('default_baseline_model', model);
      await loadSettings();
      setToast(`Default baseline model updated to ${model}`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      alert("Failed to update baseline");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Platform Settings & Security</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Provider credentials, default baseline benchmarks, cache TTL, and execution mode
        </p>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Demo Mode Toggle Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Hackathon Demo Mode vs Live Provider Mode
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              In <strong>Demo Mode</strong>, AIValueGuard serves deterministic responses and simulated token metrics with 0 API keys required. Switch to <strong>Live Provider Mode</strong> when you enter API keys below to make real LLM provider requests.
            </p>
          </div>

          <button
            onClick={handleToggleDemo}
            className={`px-4 py-2 rounded-lg font-semibold text-xs border shadow-sm transition ${
              settings?.demo_mode
                ? 'bg-amber-100/70 border-amber-300 text-amber-900 hover:bg-amber-200'
                : 'bg-emerald-100/70 border-emerald-300 text-emerald-900 hover:bg-emerald-200'
            }`}
          >
            {settings?.demo_mode ? 'Demo Mode Active' : 'Live Mode Active'}
          </button>
        </div>
      </div>

      {/* Provider API Keys Configuration */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Key className="h-4 w-4 text-brand-600" /> LLM Provider API Keys
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keys are stored securely on the backend environment. They are never exposed to browser storage, logs, or JavaScript.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* OpenAI */}
          <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-36">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                OpenAI
                {settings?.configured_api_keys.openai ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="neutral">Not Set</Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">gpt-4o, gpt-4o-mini</span>
            </div>

            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <input
                type={showKeys['openai'] ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, openai: !showKeys['openai'] })}
                className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500"
              >
                {showKeys['openai'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleSaveKey('openai', openaiKey)}
                disabled={savingKey === 'openai' || !openaiKey.trim()}
                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Anthropic */}
          <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-36">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                Anthropic
                {settings?.configured_api_keys.anthropic ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="neutral">Not Set</Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">claude-3-5-sonnet, haiku</span>
            </div>

            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <input
                type={showKeys['anthropic'] ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, anthropic: !showKeys['anthropic'] })}
                className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500"
              >
                {showKeys['anthropic'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleSaveKey('anthropic', anthropicKey)}
                disabled={savingKey === 'anthropic' || !anthropicKey.trim()}
                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Google Gemini */}
          <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-36">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                Google Gemini
                {settings?.configured_api_keys.gemini ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="neutral">Not Set</Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">gemini-1.5-flash, pro</span>
            </div>

            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <input
                type={showKeys['gemini'] ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys['gemini'] })}
                className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500"
              >
                {showKeys['gemini'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleSaveKey('gemini', geminiKey)}
                disabled={savingKey === 'gemini' || !geminiKey.trim()}
                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Groq */}
          <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-36">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                Groq
                {settings?.configured_api_keys.groq ? (
                  <Badge variant="success">Configured</Badge>
                ) : (
                  <Badge variant="neutral">Not Set</Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">llama-3.3-70b-versatile</span>
            </div>

            <div className="flex-1 flex gap-2 w-full sm:w-auto">
              <input
                type={showKeys['groq'] ? 'text' : 'password'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, groq: !showKeys['groq'] })}
                className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500"
              >
                {showKeys['groq'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleSaveKey('groq', groqKey)}
                disabled={savingKey === 'groq' || !groqKey.trim()}
                className="bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Invariants & Engine Parameters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-brand-600" /> Gateway Invariants & Routing Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default Baseline Benchmark Model</label>
            <select
              value={settings?.default_baseline_model || 'gpt-4o'}
              onChange={(e) => handleUpdateBaseline(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-slate-800"
            >
              <option value="gpt-4o">gpt-4o ($2.50 / $10.00)</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet ($3.00 / $15.00)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro ($1.25 / $5.00)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used as the comparison anchor for all savings percentage calculations.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cache Storage Backend</label>
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800">
              {settings?.cache_backend}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Configured via REDIS_URL in environment.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
