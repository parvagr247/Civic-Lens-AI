import api from './api';

/**
 * Service to manage REST API interactions with smart municipal operations,
 * AI dispatch suggestions, SLA checks, and citizen verification feedbacks.
 */

/**
 * Fetch AI dispatcher suggested route (best department, officer, SLA priority).
 * @param {string} incidentId Incident UUID.
 * @returns {Promise<Object>} Recommendation details payload.
 */
export const getAIRecommendation = (incidentId) => {
  return api.get(`/api/operations/recommendation/${incidentId}`);
};

/**
 * Compile municipal workloads, completed jobs, and average SLA resolution speed.
 * @returns {Promise<Object>} Departmental metrics data.
 */
export const getDepartmentAnalytics = () => {
  return api.get('/api/operations/analytics/departments');
};

/**
 * Trigger manual background SLA check to escalate overdue dispatches.
 * @returns {Promise<Object>} API feedback envelope.
 */
export const triggerSlaCheck = () => {
  return api.post('/api/operations/escalate/check');
};

/**
 * Submit citizen confirmation or rejection feedback for a resolved repair task.
 * @param {string} incidentId Incident UUID.
 * @param {boolean} confirm True to close incident, false to reopen.
 * @param {string} feedback Detailed user comments.
 * @param {string} [reopenPhotoUrl] Optional image evidence for reopens.
 * @returns {Promise<Object>} API verification output.
 */
export const verifyIncidentResolution = (incidentId, confirm, feedback, reopenPhotoUrl = null) => {
  return api.post(`/api/operations/verify/${incidentId}`, {
    confirm,
    feedback,
    reopenPhotoUrl
  });
};
