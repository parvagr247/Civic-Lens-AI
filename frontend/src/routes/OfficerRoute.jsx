import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isOfficer } from '../services/authService';

/**
 * Route guard restricting page access to field officers.
 * Redirects to / if unauthorized.
 */
export default function OfficerRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isOfficer()) {
    console.warn('[Route Guard] Unauthorized officer access. Redirecting...');
    return <Navigate to="/" replace />;
  }

  return children;
}
