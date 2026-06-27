import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../services/authService';

/**
 * Route guard restricting page access to administrator sessions.
 * Redirects to / if unauthorized.
 */
export default function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    console.warn('[Route Guard] Unauthorized admin route access. Redirecting to home...');
    return <Navigate to="/" replace />;
  }

  return children;
}
