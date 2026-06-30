import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalLayout from '../components/layout/GlobalLayout';
import TitleManager from '../components/layout/TitleManager';

// Lazy load large pages for optimized production chunking
const CitizenDashboard = lazy(() => import('../pages/CitizenDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const OfficerDashboard = lazy(() => import('../pages/OfficerDashboard'));
const AnalyzeIssue = lazy(() => import('../pages/AnalyzeIssue'));
const CityIntelligence = lazy(() => import('../pages/CityIntelligence'));
const RiskDashboard = lazy(() => import('../pages/RiskDashboard'));
const AICopilot = lazy(() => import('../pages/AICopilot'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const CommunityFeed = lazy(() => import('../pages/CommunityFeed'));
const ReportDetails = lazy(() => import('../pages/ReportDetails'));
const DepartmentDashboard = lazy(() => import('../pages/DepartmentDashboard'));
const AIInsightsDashboard = lazy(() => import('../pages/AIInsightsDashboard'));
const AnonymousTracker = lazy(() => import('../pages/AnonymousTracker'));
const ModerationDashboard = lazy(() => import('../pages/ModerationDashboard'));
const Landing = lazy(() => import('../pages/Landing'));
const Profile = lazy(() => import('../pages/Profile'));
const Leaderboard = lazy(() => import('../pages/Leaderboard'));

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';
import OfficerRoute from './OfficerRoute';

const PageLoader = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase animate-pulse">
      Loading Platform Assets...
    </span>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <TitleManager />
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
          <Route path="settings" element={<Settings />} />
          <Route path="incidents/:id" element={<ReportDetails />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />

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
    </Suspense>
  );
};

export default AppRoutes;
