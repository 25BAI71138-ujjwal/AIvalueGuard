import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Building2,
  Radio,
  ExternalLink
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
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Playground', path: '/playground', icon: Terminal },
    { name: 'Gateway Requests', path: '/requests', icon: Activity },
    { name: 'Models & Routing', path: '/models', icon: Layers },
    { name: 'Safe Caching', path: '/cache', icon: Database },
    { name: 'Quality Evaluations', path: '/evaluations', icon: CheckCircle2 },
    { name: 'Cost Analytics', path: '/analytics', icon: TrendingDown },
    { name: 'Optimization Lab', path: '/lab', icon: FlaskConical },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-200 z-30 select-none ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                  AIValueGuard
                  <span className="rounded bg-brand-50 px-1 py-0.2 text-[9px] font-bold text-brand-700 border border-brand-200/60 uppercase">
                    v1.0
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Cost & Quality Gateway</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Workspace Dropdown */}
        <div className="border-b border-slate-100 p-3">
          {!collapsed ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="font-medium text-slate-700 truncate">
                  {workspace === 'ws_default' ? 'Production Org (Default)' : 'Staging Environment'}
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Production Workspace" />
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-slate-100 p-3 text-[11px] text-slate-400">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                <span>Gateway Active</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">PS-08</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-slate-900">
              {navItems.find(i => i.path === location.pathname)?.name || 'AIValueGuard'}
            </h1>
            <div className="hidden sm:flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                Code Yudh PS-08
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200/60">
                Zero Quality Degradation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Operational</span>
            </div>

            {/* Quick Demo toggle badge */}
            <button
              onClick={handleToggleDemo}
              className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border transition ${
                isDemo
                  ? 'bg-amber-100/70 text-amber-900 border-amber-300 hover:bg-amber-200/80'
                  : 'bg-emerald-100/70 text-emerald-900 border-emerald-300 hover:bg-emerald-200/80'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isDemo ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{isDemo ? 'DEMO DATA' : 'LIVE API'}</span>
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
