import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { RequestsPage } from './pages/RequestsPage';
import { ModelsRoutingPage } from './pages/ModelsRoutingPage';
import { CachePage } from './pages/CachePage';
import { QualityEvalsPage } from './pages/QualityEvalsPage';
import { CostAnalyticsPage } from './pages/CostAnalyticsPage';
import { OptimizationLabPage } from './pages/OptimizationLabPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="models" element={<ModelsRoutingPage />} />
          <Route path="cache" element={<CachePage />} />
          <Route path="evaluations" element={<QualityEvalsPage />} />
          <Route path="analytics" element={<CostAnalyticsPage />} />
          <Route path="lab" element={<OptimizationLabPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
