import api from './api';

/**
 * Service to retrieve user and admin dashboards data.
 */

/**
 * Fetches the citizen dashboard profile, timeline, charts, and podium entries.
 */
export const getCitizenDashboard = () => {
  return api.get('/api/dashboard/user');
};

/**
 * Fetches the admin analytics overview, workloads, category counts, and recommendations.
 */
export const getAdminDashboard = () => {
  return api.get('/api/dashboard/admin');
};

/**
 * Updates an incident's status and rewards citizen points if resolved.
 *
 * @param {string} incidentId Unique incident UUID.
 * @param {string} status The new status string (e.g. RESOLVED, IN_PROGRESS).
 */
export const updateIncidentStatus = (incidentId, status) => {
  return api.patch(`/api/issues/${incidentId}/status?status=${status}`);
};
