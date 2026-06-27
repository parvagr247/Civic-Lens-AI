import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalLayout from '../components/layout/GlobalLayout';
import Dashboard from '../pages/Dashboard';
import AnalyzeIssue from '../pages/AnalyzeIssue';
import CityIntelligence from '../pages/CityIntelligence';
import AICopilot from '../pages/AICopilot';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

/**
 * Placeholder Guard component for Route Protection.
 * In later stages, this will validate user identity and JWT status.
 */
const ProtectedRoutePlaceholder = ({ children }) => {
  const isAuthenticated = true; // Placeholder: auto-approves for now.
  
  if (!isAuthenticated) {
    console.warn('[Route Guard] Unauthenticated access blocked. Redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Primary layout wrapper for the platform dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoutePlaceholder>
            <GlobalLayout />
          </ProtectedRoutePlaceholder>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="analyze" element={<AnalyzeIssue />} />
        <Route path="intelligence" element={<CityIntelligence />} />
        <Route path="copilot" element={<AICopilot />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
