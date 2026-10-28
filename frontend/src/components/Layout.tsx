import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  TrendingDown,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Building2,
  Radio,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Key,
  ShieldAlert
} from 'lucide-react';
import { DemoBanner } from './DemoBanner';
import { api } from '../api/client';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [hasConfiguredKeys, setHasConfiguredKeys] = useState(false);
  const [workspace, setWorkspace] = useState('ws_default');
  const location = useLocation();

  useEffect(() => {
    // Check initial settings
    api.getSettings().then(s => {
      setIsDemo(s.demo_mode);
      const anyKey = Object.values(s.configured_api_keys).some(v => v);
      setHasConfiguredKeys(anyKey);
    }).catch(() => {});
  }, []);

  const handleToggleDemo = async () => {
    try {
      const res = await api.toggleDemoMode();
      setIsDemo(res.demo_mode);
    } catch (e) {
      alert("Failed to toggle demo mode");
    }
  };

  const navItems = [
    { name: 'AI Chat & Token Tracker', path: '/token-tracker', icon: Sparkles, badge: 'LIVE AI' },
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Playground', path: '/playground', icon: Terminal },
    { name: 'Gateway Requests', path: '/requests', icon: Activity },
    { name: 'Models & Routing', path: '/models', icon: Layers },
    { name: 'Safe Caching', path: '/cache', icon: Database },
    { name: 'Quality Guardrails', path: '/evaluations', icon: CheckCircle2 },
    { name: 'Cost Analytics', path: '/analytics', icon: TrendingDown },
    { name: 'Optimization Lab', path: '/lab', icon: FlaskConical },
    { name: 'Settings & Keys', path: '/settings', icon: Settings },
  ];


  const currentNav = navItems.find(i => i.path === location.pathname) || navItems[0];

  return (
    <div className="flex h-screen bg-transparent text-slate-100 font-sans antialiased overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-obsidian-border/80 bg-obsidian-950/80 backdrop-blur-xl transition-all duration-200 z-30 select-none ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-obsidian-border/80 px-4 bg-obsidian-card/60 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 text-white shadow-md shadow-cyan-500/25 ring-1 ring-white/20 group-hover:scale-105 transition">
              <Flame className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-heading tracking-[0.14em] font-bold text-sm text-white flex items-center gap-1.5 uppercase">
                  Portkey <span className="text-cyan-400">Gateway</span>
                  <span className="rounded bg-cyan-500/10 px-1 py-0.2 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/30 uppercase">
                    v2.5
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">Production AI Control Plane</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-obsidian-border hover:text-white transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Return to Marketing Landing Page Button */}
        <div className="p-2 border-b border-obsidian-border/80 bg-obsidian-950/40 backdrop-blur-sm">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-white/[0.04] transition ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Switch to Portkey Marketing Landing Page"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            {!collapsed && <span>View Marketing Page</span>}
          </Link>
        </div>

        {/* Workspace Dropdown */}
        <div className="border-b border-obsidian-border/80 p-3">
          {!collapsed ? (
            <div className="rounded-lg bg-obsidian-card/70 backdrop-blur-md border border-obsidian-border p-2.5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-200 truncate font-mono text-[11px]">
                  {workspace === 'ws_default' ? 'Production (ws_default)' : 'Staging Environment'}
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20 shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" title="Production Workspace" />
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/overview' && (location.pathname === '/' || location.pathname === '/console'));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-obsidian-card/60 hover:text-slate-200'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="rounded bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black shadow-xs shrink-0 ml-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-obsidian-border/80 p-3 text-[11px] text-slate-400 bg-obsidian-card/60 backdrop-blur-md">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span className="text-slate-300">Gateway Active</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">&lt; 1ms SLA</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-obsidian-border/80 bg-obsidian-950/75 backdrop-blur-xl px-6 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-heading tracking-[0.1em] uppercase font-bold text-white tracking-tight">
              {currentNav.name}
            </h1>
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
              <span className="rounded-full bg-obsidian-card px-2.5 py-0.5 font-medium text-slate-300 border border-obsidian-border">
                Portkey Gateway v2.5
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 font-medium text-cyan-300 border border-cyan-500/30">
                Cryptographic Cache & Router
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Switcher to Marketing Landing */}
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-card border border-obsidian-border hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              <span>Marketing Landing</span>
            </Link>

            {/* Health pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-mono font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational (0.8ms)</span>
            </div>

            {/* Quick Demo toggle badge */}
            <button
              onClick={handleToggleDemo}
              className={`rounded-full px-3 py-1 text-xs font-mono font-semibold flex items-center gap-1.5 border transition ${
                isDemo
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span>{isDemo ? 'DEMO MODE' : 'LIVE PROVIDERS'}</span>
            </button>
          </div>
        </header>

        {/* Global Demo Status Banner */}
        <DemoBanner
          isDemo={isDemo}
          onToggleDemo={handleToggleDemo}
          hasConfiguredKeys={hasConfiguredKeys}
        />

        {/* Page Content scroll container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet context={{ isDemo, onToggleDemo: handleToggleDemo }} />
        </main>
      </div>
    </div>
  );
};
