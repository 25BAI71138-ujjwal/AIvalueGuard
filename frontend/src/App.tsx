import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PortkeyLandingPage } from './pages/PortkeyLandingPage';
import { TokenTracker3DPage } from './pages/TokenTracker3DPage';
import { OverviewPage } from './pages/OverviewPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { RequestsPage } from './pages/RequestsPage';
import { ModelsRoutingPage } from './pages/ModelsRoutingPage';
import { CachePage } from './pages/CachePage';
import { QualityEvalsPage } from './pages/QualityEvalsPage';
import { CostAnalyticsPage } from './pages/CostAnalyticsPage';
import { OptimizationLabPage } from './pages/OptimizationLabPage';
import { SettingsPage } from './pages/SettingsPage';
import { AmbientVideoBackground } from './components/AmbientVideoBackground';

export function App() {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Ambient Fluid Video Background for entire application */}
      <AmbientVideoBackground />

      <BrowserRouter>
        <Routes>
          {/* Dedicated Marketing Landing Route */}
          <Route path="/landing" element={<PortkeyLandingPage />} />

          {/* AI Gateway Console & 3D Token Tracker Platform */}
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/console" element={<OverviewPage />} />
            <Route path="/token-tracker" element={<TokenTracker3DPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/models" element={<ModelsRoutingPage />} />
            <Route path="/cache" element={<CachePage />} />
            <Route path="/evaluations" element={<QualityEvalsPage />} />
            <Route path="/analytics" element={<CostAnalyticsPage />} />
            <Route path="/lab" element={<OptimizationLabPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
