import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalLayout from '../components/layout/GlobalLayout';
import CitizenDashboard from '../pages/CitizenDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import OfficerDashboard from '../pages/OfficerDashboard';
import AnalyzeIssue from '../pages/AnalyzeIssue';
import CityIntelligence from '../pages/CityIntelligence';
import RiskDashboard from '../pages/RiskDashboard';
import AICopilot from '../pages/AICopilot';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';
import Register from '../pages/Register';
import CommunityFeed from '../pages/CommunityFeed';
import ReportDetails from '../pages/ReportDetails';
import DepartmentDashboard from '../pages/DepartmentDashboard';
import AIInsightsDashboard from '../pages/AIInsightsDashboard';
import AnonymousTracker from '../pages/AnonymousTracker';
import ModerationDashboard from '../pages/ModerationDashboard';
import Landing from '../pages/Landing';
import Profile from '../pages/Profile';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';
import OfficerRoute from './OfficerRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Guest Only Routes (Login/Register) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* Main App Layout Wrapper */}
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Main App Layout Wrapper */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <GlobalLayout />
          </ProtectedRoute>
        }
      >
        {/* Citizen Dashboards & Pages */}
        <Route path="dashboard" element={<CitizenDashboard />} />
        <Route path="analyze" element={<AnalyzeIssue />} />
        <Route path="feed" element={<CommunityFeed />} />
        <Route path="intelligence" element={<CityIntelligence />} />
        <Route path="risk-intelligence" element={<RiskDashboard />} />
        <Route path="copilot" element={<AICopilot />} />
        <Route path="settings" element={<Settings />} />
        <Route path="incidents/:id" element={<ReportDetails />} />
        <Route path="profile/:userId" element={<Profile />} />

        {/* Admin Dashboard Page (requires Admin authorization) */}
        <Route
          path="admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="departments"
          element={
            <AdminRoute>
              <DepartmentDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="ai-insights"
          element={
            <AdminRoute>
              <AIInsightsDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="moderation"
          element={
            <AdminRoute>
              <ModerationDashboard />
            </AdminRoute>
          }
        />

        {/* Officer Dashboard Page (requires Officer authorization) */}
        <Route
          path="officer-dashboard"
          element={
            <OfficerRoute>
              <OfficerDashboard />
            </OfficerRoute>
          }
        />
      </Route>

      {/* Public Layout Wrapper */}
      <Route
        path="/"
        element={<GlobalLayout />}
      >
        <Route path="track" element={<AnonymousTracker />} />
      </Route>

      {/* Fallback routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
