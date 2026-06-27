import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

/**
 * Route guard preventing logged-in users from seeing authentication forms.
 * Redirects to home page / if authenticated.
 */
export default function GuestRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
