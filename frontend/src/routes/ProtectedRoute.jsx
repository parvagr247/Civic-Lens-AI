import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

/**
 * Route guard restricting page access to authenticated sessions.
 * Redirects to /login if unauthenticated.
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    console.warn('[Route Guard] Protected access blocked. Redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  return children;
}
